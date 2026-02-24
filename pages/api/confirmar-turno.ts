// API para que el profesional confirme un turno pagado por transferencia
// Crea el evento en Google Calendar y confirma el booking
import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { createEventForClient } from '../../lib/google-calendar';
import { requireActiveClient } from '../../lib/auth/client-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Requiere sesión activa del profesional
    const session = await requireActiveClient();

    const { booking_id } = req.body;

    if (!booking_id) {
      return res.status(400).json({ error: 'booking_id requerido' });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Obtener el booking con datos completos
    const bookingResult = await sql`
      SELECT
        b.id,
        b.client_id,
        b.paciente_nombre,
        b.paciente_email,
        b.paciente_telefono,
        b.fecha_hora,
        b.notas,
        b.evento_id,
        b.estado,
        b.google_event_id
      FROM bookings b
      WHERE b.id = ${booking_id}
        AND b.client_id = ${session.id}
      LIMIT 1
    `;

    if (bookingResult.length === 0) {
      return res.status(404).json({ error: 'Booking no encontrado' });
    }

    const booking = bookingResult[0];

    // Solo se puede confirmar si está en estado pending_confirmation o paid
    if (!['pending_confirmation', 'paid', 'pending_payment'].includes(booking.estado)) {
      return res.status(400).json({
        error: `No se puede confirmar un booking en estado '${booking.estado}'`,
      });
    }

    // Si ya tiene evento en Google Calendar, no crear otro
    if (booking.google_event_id) {
      // Solo actualizar estado
      await sql`
        UPDATE bookings
        SET estado = 'confirmed', confirmed_at = NOW()
        WHERE id = ${booking_id}
      `;

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
        SELECT nombre, duracion, modalidad
        FROM eventos
        WHERE id = ${booking.evento_id}
        LIMIT 1
      `;
      if (eventoResult.length > 0) {
        duracion = eventoResult[0].duracion || 30;
        modalidad = eventoResult[0].modalidad || 'virtual';
        eventoNombre = eventoResult[0].nombre || 'Consulta';
      }
    }

    const fechaInicio = new Date(booking.fecha_hora);
    const fechaFin = new Date(fechaInicio.getTime() + duracion * 60 * 1000);

    // Crear evento en Google Calendar
    const gcEvent = await createEventForClient(booking.client_id, {
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

    // Actualizar booking
    await sql`
      UPDATE bookings
      SET
        google_event_id = ${gcEvent.google_event_id},
        meet_link = ${gcEvent.meet_link},
        estado = 'confirmed',
        confirmed_at = NOW()
      WHERE id = ${booking_id}
    `;

    console.log(`[confirmar-turno] Booking ${booking_id} confirmed. Google Event: ${gcEvent.google_event_id}`);

    return res.status(200).json({
      success: true,
      message: 'Turno confirmado y evento creado en Google Calendar',
      booking_id,
      google_event_id: gcEvent.google_event_id,
      meet_link: gcEvent.meet_link,
    });
  } catch (error: any) {
    console.error('Error confirming booking:', error);
    return res.status(500).json({ error: 'Error al confirmar el turno' });
  }
}
