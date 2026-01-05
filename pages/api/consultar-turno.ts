// API para consultar datos de un turno desde Cal.com
import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bookingId } = req.query;

  if (!bookingId || typeof bookingId !== 'string') {
    return res.status(400).json({ error: 'bookingId requerido' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);

    // Obtener todos los clientes con Cal.com configurado
    const clients = await sql`
      SELECT slug, cal_api_key, nombre_completo, monto_consulta
      FROM clients
      WHERE cal_api_key IS NOT NULL AND cal_api_key != ''
    `;

    if (clients.length === 0) {
      return res.status(404).json({ error: 'No hay clientes con Cal.com configurado' });
    }

    // Intentar obtener el booking con cada API key hasta encontrarlo
    for (const client of clients) {
      try {
        const response = await axios.get(
          `https://api.cal.com/v1/bookings/${bookingId}`,
          {
            headers: {
              'cal-api-version': '2024-08-13',
              Authorization: `Bearer ${client.cal_api_key}`,
            },
          }
        );

        const booking = response.data;

        // Si llegamos aquí, encontramos el booking
        const attendee = booking.attendees?.[0] || booking.responses;

        return res.status(200).json({
          name: attendee?.name || 'Paciente',
          email: attendee?.email || '',
          date: new Date(booking.startTime).toLocaleString('es-AR', {
            dateStyle: 'full',
            timeStyle: 'short',
          }),
          bookingId: bookingId,
          clientSlug: client.slug,
          startTime: booking.startTime,
          monto: client.monto_consulta || 10000,
        });
      } catch (error) {
        // Si falla, continuar con el siguiente cliente
        continue;
      }
    }

    // Si llegamos aquí, no encontramos el booking con ninguna API key
    return res.status(404).json({ error: 'Booking no encontrado' });
  } catch (error) {
    console.error('Error al consultar turno:', error);
    return res.status(500).json({ error: 'Error al consultar turno' });
  }
}
