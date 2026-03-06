// Endpoint GET para magic links de confirmación/rechazo de turnos
// El médico llega aquí desde los botones en el email de comprobante
// Retorna HTML (no JSON) porque el médico navega desde el browser
import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { verifyActionToken } from '../../lib/booking-token';
import { createEventForClient } from '../../lib/google-calendar';
import { sendBookingConfirmation, sendBookingCancellation } from '../../lib/email';

function htmlPage(title: string, icon: string, body: string, color: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} · e-bio-link</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f6f9; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,.1); max-width: 440px; width: 100%; padding: 40px 36px; text-align: center; }
    .icon { font-size: 56px; margin-bottom: 16px; }
    h1 { font-size: 22px; font-weight: 700; color: ${color}; margin-bottom: 10px; }
    p { font-size: 15px; color: #4b5563; line-height: 1.6; }
    .brand { margin-top: 32px; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    ${body}
    <div class="brand">e-bio-link</div>
  </div>
</body>
</html>`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).end('Method not allowed');
  }

  const { booking_id, action, token, ts: tsRaw } = req.query;

  if (!booking_id || !action || !token || !tsRaw || typeof booking_id !== 'string' || typeof action !== 'string' || typeof token !== 'string' || typeof tsRaw !== 'string') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(400).send(htmlPage(
      'Link inválido',
      '🔒',
      '<p>El link es inválido o está incompleto.</p>',
      '#dc2626'
    ));
  }

  const ts = parseInt(tsRaw, 10);
  if (isNaN(ts)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(400).send(htmlPage(
      'Link inválido',
      '🔒',
      '<p>El link es inválido o está incompleto.</p>',
      '#dc2626'
    ));
  }

  // Verificar token HMAC con expiración de 7 días
  const valid = verifyActionToken(booking_id, action, token, ts);
  if (!valid) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(403).send(htmlPage(
      'Link inválido',
      '🔒',
      '<p>El link de seguridad no es válido. Si creés que es un error, contactate con soporte.</p>',
      '#dc2626'
    ));
  }

  const sql = neon(process.env.DATABASE_URL!);

  // Obtener booking con datos completos
  const bookingResult = await sql`
    SELECT
      b.id, b.client_id, b.evento_id, b.paciente_nombre, b.paciente_email,
      b.paciente_telefono, b.fecha_hora, b.monto, b.notas, b.estado
    FROM bookings b
    WHERE b.id = ${booking_id}
    LIMIT 1
  `;

  if (bookingResult.length === 0) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(404).send(htmlPage(
      'Turno no encontrado',
      '❓',
      '<p>No se encontró el turno solicitado.</p>',
      '#6b7280'
    ));
  }

  const booking = bookingResult[0];

  // Idempotencia: si ya fue procesado, mostrar estado actual
  if (booking.estado === 'confirmed') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(htmlPage(
      'Turno ya confirmado',
      '✅',
      `<p>Este turno ya fue confirmado anteriormente. El paciente <strong>${booking.paciente_nombre}</strong> ya fue notificado.</p>`,
      '#16a34a'
    ));
  }

  if (booking.estado === 'cancelled') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(htmlPage(
      'Turno ya rechazado',
      '❌',
      `<p>Este turno ya fue rechazado anteriormente. El paciente <strong>${booking.paciente_nombre}</strong> ya fue notificado.</p>`,
      '#dc2626'
    ));
  }

  // Obtener datos del profesional y evento
  const clientResult = await sql`
    SELECT id, nombre_completo, especialidad, email FROM clients WHERE id = ${booking.client_id} LIMIT 1
  `;
  const clientInfo = clientResult[0];

  let duracion = 30;
  let modalidad: 'virtual' | 'presencial' = 'virtual';
  let eventoNombre = 'Consulta';

  if (booking.evento_id) {
    const eventoResult = await sql`
      SELECT nombre, duracion_minutos, modalidad FROM eventos WHERE id = ${booking.evento_id} LIMIT 1
    `;
    if (eventoResult.length > 0) {
      duracion = eventoResult[0].duracion_minutos || 30;
      modalidad = eventoResult[0].modalidad || 'virtual';
      eventoNombre = eventoResult[0].nombre || 'Consulta';
    }
  }

  // ── CONFIRMAR ─────────────────────────────────────────────────────────────
  if (action === 'confirm') {
    const fechaInicio = new Date(booking.fecha_hora);
    const fechaFin = new Date(fechaInicio.getTime() + duracion * 60 * 1000);

    // Intentar crear evento en Google Calendar (no bloquea si falla)
    let gcEvent: { google_event_id: string; meet_link: string | null; html_link: string } | null = null;
    try {
      gcEvent = await createEventForClient(booking.client_id, {
        booking_id: booking.id,
        titulo: `${eventoNombre} - ${booking.paciente_nombre}`,
        descripcion: 'Turno confirmado vía e-bio-link',
        fecha_hora: fechaInicio.toISOString(),
        fecha_hora_fin: fechaFin.toISOString(),
        paciente_nombre: booking.paciente_nombre,
        paciente_email: booking.paciente_email,
        paciente_telefono: booking.paciente_telefono || '',
        modalidad,
        notas: booking.notas,
      });
    } catch (gcError: any) {
      console.error('[accion-turno] Google Calendar no disponible:', gcError.message);
    }

    // Confirmar booking
    await sql`
      UPDATE bookings
      SET
        google_event_id = ${gcEvent?.google_event_id || null},
        meet_link = ${gcEvent?.meet_link || null},
        estado = 'confirmed',
        confirmed_at = NOW()
      WHERE id = ${booking_id}
    `;

    console.log(`[accion-turno] Booking ${booking_id} CONFIRMED. GC: ${gcEvent?.google_event_id || 'none'}`);

    // Email de confirmación al paciente
    await sendBookingConfirmation({
      paciente_nombre: booking.paciente_nombre,
      paciente_email: booking.paciente_email,
      medico_nombre: clientInfo?.nombre_completo || '',
      medico_especialidad: clientInfo?.especialidad || undefined,
      fecha_hora: booking.fecha_hora,
      evento_nombre: eventoNombre,
      modalidad,
      meet_link: gcEvent?.meet_link || null,
      monto: booking.monto,
    }).catch((e) => console.error('[Email] Error confirmación paciente:', e.message));

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(htmlPage(
      'Turno confirmado',
      '✅',
      `<p>El turno de <strong>${booking.paciente_nombre}</strong> fue confirmado exitosamente.</p>
       <p style="margin-top:12px;">El paciente ya recibió su email de confirmación${gcEvent?.meet_link ? ' con el link de Google Meet' : ''}.</p>`,
      '#16a34a'
    ));
  }

  // ── RECHAZAR ─────────────────────────────────────────────────────────────
  if (action === 'reject') {
    await sql`
      UPDATE bookings SET estado = 'cancelled' WHERE id = ${booking_id}
    `;

    console.log(`[accion-turno] Booking ${booking_id} REJECTED.`);

    // Email de cancelación al paciente
    await sendBookingCancellation({
      paciente_nombre: booking.paciente_nombre,
      paciente_email: booking.paciente_email,
      medico_nombre: clientInfo?.nombre_completo || '',
      fecha_hora: booking.fecha_hora,
    }).catch((e) => console.error('[Email] Error cancelación paciente:', e.message));

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(htmlPage(
      'Turno rechazado',
      '❌',
      `<p>El turno de <strong>${booking.paciente_nombre}</strong> fue rechazado.</p>
       <p style="margin-top:12px;">El paciente ya recibió un email informando que el turno no fue confirmado.</p>`,
      '#dc2626'
    ));
  }

  // Action desconocida (no debería llegar acá si el token es válido)
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(400).send(htmlPage(
    'Acción inválida',
    '⚠️',
    '<p>La acción solicitada no es válida.</p>',
    '#d97706'
  ));
}
