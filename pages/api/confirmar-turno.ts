// API para que el profesional confirme un turno pagado por transferencia
// Crea el evento en Google Calendar y confirma el booking
import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { createEventForClient } from '../../lib/google-calendar';
import { requireActiveClientFromRequest } from '../../lib/auth/client-auth';
import { sendBookingConfirmation, sendNewBookingNotification, sendBookingCancellation } from '../../lib/email';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Requiere sesión activa del profesional (Pages Router: usa req)
    const session = await requireActiveClientFromRequest(req);

    const { booking_id, action = 'confirm' } = req.body;

    if (!booking_id) {
      return res.status(400).json({ error: 'booking_id requerido' });
    }

    if (!['confirm', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'action debe ser "confirm" o "reject"' });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Datos del profesional para emails
    const clientInfoResult = await sql`
      SELECT nombre_completo, especialidad, email FROM clients WHERE id = ${session.id} LIMIT 1
    `;
    const clientInfo = clientInfoResult[0];

    // Obtener el booking con datos completos
    const bookingResult = await sql`
      SELECT
        b.id,
        b.client_id,
        b.paciente_nombre,
        b.paciente_email,
        b.paciente_telefono,
        b.fecha_hora,
        b.monto,
        b.notas,
        b.evento_id,
        b.estado,
        b.google_event_id,
        b.meet_link
      FROM bookings b
      WHERE b.id = ${booking_id}
        AND b.client_id = ${session.id}
      LIMIT 1
    `;

    if (bookingResult.length === 0) {
      return res.status(404).json({ error: 'Booking no encontrado' });
    }

    const booking = bookingResult[0];

    const estadosAccionables = ['pending_confirmation', 'paid', 'pending_payment', 'pending'];
    if (!estadosAccionables.includes(booking.estado)) {
      return res.status(400).json({
        error: `No se puede modificar un booking en estado '${booking.estado}'`,
      });
    }

    // ── RECHAZO ───────────────────────────────────────────────────────────────
    if (action === 'reject') {
      await sql`
        UPDATE bookings SET estado = 'cancelled' WHERE id = ${booking_id}
      `;

      await sendBookingCancellation({
        paciente_nombre: booking.paciente_nombre,
        paciente_email: booking.paciente_email,
        medico_nombre: clientInfo?.nombre_completo || '',
        fecha_hora: booking.fecha_hora,
      }).catch((e) => console.error('[Email] Error cancelación:', e.message));

      console.log(`[confirmar-turno] Booking ${booking_id} rejected by professional`);
      return res.status(200).json({ success: true, message: 'Turno rechazado', booking_id });
    }

    // ── CONFIRMACIÓN ─────────────────────────────────────────────────────────
    // Si ya tiene evento en Google Calendar, no crear otro
    if (booking.google_event_id) {
      // Solo actualizar estado
      await sql`
        UPDATE bookings
        SET estado = 'confirmed', confirmed_at = NOW()
        WHERE id = ${booking_id}
      `;

      const emailData = {
        paciente_nombre: booking.paciente_nombre,
        paciente_email: booking.paciente_email,
        medico_nombre: clientInfo?.nombre_completo || '',
        medico_especialidad: clientInfo?.especialidad || undefined,
        fecha_hora: booking.fecha_hora,
        meet_link: booking.meet_link || null,
        monto: booking.monto,
      };
      await Promise.all([
        sendBookingConfirmation(emailData).catch((e) =>
          console.error('[Email] Error confirmación paciente:', e.message)
        ),
        clientInfo?.email
          ? sendNewBookingNotification({
              ...emailData,
              medico_email: clientInfo.email,
              paciente_telefono: booking.paciente_telefono || undefined,
              notas: booking.notas || undefined,
            }).catch((e) => console.error('[Email] Error notif profesional:', e.message))
          : Promise.resolve(),
      ]);

      return res.status(200).json({
        success: true,
        message: 'Turno confirmado',
        booking_id,
      });
    }

    // Obtener datos del evento (duración y modalidad)
    let duracion = 30;
    let modalidad: 'virtual' | 'presencial' = 'virtual';
    let eventoNombre = 'Consulta';

    if (booking.evento_id) {
      const eventoResult = await sql`
        SELECT nombre, duracion_minutos, modalidad
        FROM eventos
        WHERE id = ${booking.evento_id}
        LIMIT 1
      `;
      if (eventoResult.length > 0) {
        duracion = eventoResult[0].duracion_minutos || 30;
        modalidad = eventoResult[0].modalidad || 'virtual';
        eventoNombre = eventoResult[0].nombre || 'Consulta';
      }
    }

    const fechaInicio = new Date(booking.fecha_hora);
    const fechaFin = new Date(fechaInicio.getTime() + duracion * 60 * 1000);

    // Intentar crear evento en Google Calendar (no bloquea si el cliente no lo tiene conectado)
    let gcEvent: { google_event_id: string; meet_link: string | null; html_link: string } | null = null;
    try {
      gcEvent = await createEventForClient(booking.client_id, {
        booking_id: booking.id,
        titulo: `${eventoNombre} - ${booking.paciente_nombre}`,
        descripcion: `Turno confirmado vía e-bio-link`,
        fecha_hora: fechaInicio.toISOString(),
        fecha_hora_fin: fechaFin.toISOString(),
        paciente_nombre: booking.paciente_nombre,
        paciente_email: booking.paciente_email,
        paciente_telefono: booking.paciente_telefono || '',
        modalidad,
        notas: booking.notas,
      });
    } catch (gcError: any) {
      console.error('[confirmar-turno] Google Calendar no disponible:', gcError.message);
    }

    // Actualizar booking
    await sql`
      UPDATE bookings
      SET
        google_event_id = ${gcEvent?.google_event_id || null},
        meet_link = ${gcEvent?.meet_link || null},
        estado = 'confirmed',
        confirmed_at = NOW()
      WHERE id = ${booking_id}
    `;

    console.log(`[confirmar-turno] Booking ${booking_id} confirmed. Google Event: ${gcEvent?.google_event_id || 'none'}`);

    const emailData = {
      paciente_nombre: booking.paciente_nombre,
      paciente_email: booking.paciente_email,
      medico_nombre: clientInfo?.nombre_completo || '',
      medico_especialidad: clientInfo?.especialidad || undefined,
      fecha_hora: booking.fecha_hora,
      evento_nombre: eventoNombre,
      modalidad,
      meet_link: gcEvent?.meet_link || null,
      monto: booking.monto,
    };
    await Promise.all([
      sendBookingConfirmation(emailData).catch((e) =>
        console.error('[Email] Error confirmación paciente:', e.message)
      ),
      clientInfo?.email
        ? sendNewBookingNotification({
            ...emailData,
            medico_email: clientInfo.email,
            paciente_telefono: booking.paciente_telefono || undefined,
            notas: booking.notas || undefined,
          }).catch((e) => console.error('[Email] Error notif profesional:', e.message))
        : Promise.resolve(),
    ]);

    return res.status(200).json({
      success: true,
      message: gcEvent ? 'Turno confirmado y evento creado en Google Calendar' : 'Turno confirmado (sin Google Calendar)',
      booking_id,
      google_event_id: gcEvent?.google_event_id || null,
      meet_link: gcEvent?.meet_link || null,
    });
  } catch (error: any) {
    console.error('Error confirming booking:', error);
    return res.status(500).json({ error: 'Error al confirmar el turno' });
  }
}
