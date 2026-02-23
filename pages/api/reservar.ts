// pages/api/reservar.ts
// Endpoint público para crear un booking de turno
// No requiere auth del cliente (es el paciente quien reserva)

import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';

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
        slug,
        payment_method,
        cbu_alias,
        banco_nombre,
        titular_cuenta,
        mp_access_token,
        mp_user_id
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
      SELECT id, nombre, duracion_minutos, precio, modalidad
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

    // 3. Crear booking en DB con estado 'pending_payment'
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
        notas
      )
      VALUES (
        ${client.id},
        ${evento.id},
        ${paciente_nombre},
        ${paciente_email},
        ${paciente_telefono || null},
        ${fecha_hora},
        ${evento.precio},
        'pending_payment',
        ${client.payment_method || 'transfer'},
        ${notas || null}
      )
      RETURNING id
    `;

    const bookingId = bookingResult[0].id;

    // 6. Responder con booking_id y método de pago
    const paymentMethod = client.payment_method || 'transfer';

    const response: any = {
      success: true,
      booking_id: bookingId,
      payment_method: paymentMethod,
      evento: {
        nombre: evento.nombre,
        duracion_minutos: evento.duracion_minutos,
        precio: evento.precio,
        modalidad: evento.modalidad,
      },
    };

    // Incluir datos de transferencia si aplica
    if (paymentMethod === 'transfer') {
      response.transfer_data = {
        cbu_alias: client.cbu_alias || null,
        banco_nombre: client.banco_nombre || null,
        titular_cuenta: client.titular_cuenta || null,
        monto: evento.precio,
      };
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
