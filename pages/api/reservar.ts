// pages/api/reservar.ts
// Endpoint público para crear un booking de turno
// No requiere auth del cliente (es el paciente quien reserva)

import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { sendInstruccionesPago } from '../../lib/email';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    client_slug,
    evento_id,
    fecha_hora,      // ISO: "2024-03-15T09:00:00-03:00"
    paciente_nombre,
    paciente_email,
    paciente_telefono,
    notas,
  } = req.body;

  // Validaciones
  if (!client_slug || !evento_id || !fecha_hora || !paciente_nombre || !paciente_email) {
    return res.status(400).json({
      error: 'Campos requeridos: client_slug, evento_id, fecha_hora, paciente_nombre, paciente_email',
    });
  }

  // Validar formato de email básico
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paciente_email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  // No permitir fechas pasadas
  if (new Date(fecha_hora) <= new Date()) {
    return res.status(400).json({ error: 'No se pueden reservar turnos en el pasado' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);

    // 1. Obtener cliente y configuración de pago
    const clientResult = await sql`
      SELECT
        id,
        nombre_completo,
        email,
        slug,
        payment_method,
        cbu_alias,
        banco_nombre,
        titular_cuenta,
        mp_access_token,
        mp_user_id,
        payment_window_minutes
      FROM clients
      WHERE slug = ${client_slug}
        AND status = 'active'
      LIMIT 1
    `;

    if (clientResult.length === 0) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    const client = clientResult[0];

    // 2. Obtener el evento
    const eventoResult = await sql`
      SELECT id, nombre, duracion_minutos, precio, modalidad, max_por_dia, cobro_tipo, sena_monto, direccion
      FROM eventos
      WHERE id = ${evento_id}
        AND client_id = ${client.id}
        AND activo = true
      LIMIT 1
    `;

    if (eventoResult.length === 0) {
      return res.status(404).json({ error: 'Tipo de evento no encontrado o inactivo' });
    }

    const evento = eventoResult[0];

    // 3. Re-verificar max_por_dia (previene race conditions con la consulta de slots)
    if (evento.max_por_dia !== null && evento.max_por_dia > 0) {
      const fechaDate = new Date(fecha_hora).toISOString().substring(0, 10);
      const bookingCount = await sql`
        SELECT COUNT(*)::int as count
        FROM bookings
        WHERE evento_id = ${evento.id}
          AND DATE(fecha_hora AT TIME ZONE 'America/Argentina/Buenos_Aires') = ${fechaDate}
          AND (
            estado NOT IN ('cancelled', 'pending_payment')
            OR (estado = 'pending_payment' AND (expires_at IS NULL OR expires_at > now()))
          )
      `;
      const count = (bookingCount[0]?.count as number) || 0;
      if (count >= evento.max_por_dia) {
        return res.status(409).json({
          error: `No hay más disponibilidad para este tipo de consulta en la fecha seleccionada (límite de ${evento.max_por_dia} turnos/día alcanzado)`,
        });
      }
    }

    // Calcular monto a cobrar al reservar (seña o total)
    const esSeña = evento.cobro_tipo === 'sena' && evento.sena_monto;
    const montoACobrar = esSeña ? Number(evento.sena_monto) : Number(evento.precio);

    // Calcular deadline de pago: min(now + ventana, fecha_hora del turno)
    const windowMin = Number(client.payment_window_minutes) || 120;
    const expiresAt = new Date(Math.min(
      Date.now() + windowMin * 60_000,
      new Date(fecha_hora).getTime()
    ));

    // 5. Crear booking en DB con estado 'pending_payment'
    // Nota: la verificación de disponibilidad en Google Calendar se omite aquí
    // El evento se crea en Google Calendar post-confirmación de pago
    const bookingResult = await sql`
      INSERT INTO bookings (
        client_id,
        evento_id,
        paciente_nombre,
        paciente_email,
        paciente_telefono,
        fecha_hora,
        monto,
        estado,
        payment_method,
        notas,
        expires_at
      )
      VALUES (
        ${client.id},
        ${evento.id},
        ${paciente_nombre},
        ${paciente_email},
        ${paciente_telefono || null},
        ${fecha_hora},
        ${montoACobrar},
        'pending_payment',
        ${client.payment_method || 'transfer'},
        ${notas || null},
        ${expiresAt.toISOString()}
      )
      RETURNING id, public_token
    `;

    const bookingId = bookingResult[0].id;
    const publicToken = bookingResult[0].public_token;

    // 6. Responder con booking_id y método de pago

    const paymentMethod = client.payment_method || 'transfer';

    const response: any = {
      success: true,
      booking_id: bookingId,
      public_token: publicToken,
      payment_method: paymentMethod,
      evento: {
        nombre: evento.nombre,
        duracion_minutos: evento.duracion_minutos,
        precio: evento.precio,
        modalidad: evento.modalidad,
        direccion: evento.direccion || null,
        cobro_tipo: evento.cobro_tipo || 'total',
        sena_monto: evento.sena_monto ? Number(evento.sena_monto) : null,
      },
    };

    // Incluir datos de transferencia si aplica
    if (paymentMethod === 'transfer') {
      response.transfer_data = {
        cbu_alias: client.cbu_alias || null,
        banco_nombre: client.banco_nombre || null,
        titular_cuenta: client.titular_cuenta || null,
        monto: montoACobrar,
      };
    }

    // Enviar email con instrucciones de pago (solo transfer; MP tiene su propio flujo)
    // IMPORTANTE: se awaita antes de responder — en Vercel el proceso muere al enviar la respuesta
    // y las promesas fire-and-forget nunca completan su request HTTP a Resend.
    if (paymentMethod === 'transfer') {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ebiolink.app';
      const linkPago = `${baseUrl}/reserva/${client_slug}/pago?token=${publicToken}`;
      await sendInstruccionesPago({
        paciente_nombre,
        paciente_email,
        medico_nombre: client.nombre_completo,
        medico_email: client.email || undefined,
        fecha_hora,
        evento_nombre: evento.nombre,
        monto: montoACobrar,
        cobro_tipo: evento.cobro_tipo || 'total',
        precio_total: esSeña ? Number(evento.precio) : undefined,
        cbu_alias: client.cbu_alias,
        banco_nombre: client.banco_nombre,
        titular_cuenta: client.titular_cuenta,
        link_pago: linkPago,
        ventana_minutos: windowMin,
      }).catch((e) => console.error('[Email] Error instrucciones pago:', e.message));
    }

    return res.status(201).json(response);

  } catch (error: any) {
    console.error('Error en /api/reservar:', error);
    return res.status(500).json({
      error: 'Error al crear la reserva',
      details: error.message,
    });
  }
}
