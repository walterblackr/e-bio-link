// pages/api/slots/[slug].ts
// Endpoint público: retorna slots disponibles para un profesional en una fecha dada
// Query params: ?date=YYYY-MM-DD&evento_id=X
// Soporta: múltiples bloques por día, buffers, antelación mínima, máximo por día

import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { getValidAccessToken, getFreeBusy } from '../../../lib/google-calendar';

// Argentina siempre es UTC-3 (no tiene horario de verano)
const TZ_OFFSET = '-03:00';

function toArgentinaISO(date: string, time: string): string {
  return `${date}T${time}:00${TZ_OFFSET}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.query;
  const { date, evento_id } = req.query;

  if (!slug || !date || !evento_id) {
    return res.status(400).json({ error: 'Parámetros requeridos: date, evento_id' });
  }

  const dateStr = date as string;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return res.status(400).json({ error: 'Formato de fecha inválido. Use YYYY-MM-DD' });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const requestedDate = new Date(dateStr + 'T00:00:00');
  if (requestedDate < today) {
    return res.status(400).json({ error: 'No se pueden consultar fechas pasadas' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);

    // 1. Obtener cliente por slug con tokens de Google
    const clientResult = await sql`
      SELECT
        id,
        nombre_completo,
        google_access_token,
        google_refresh_token,
        google_token_expiry,
        google_calendar_id
      FROM clients
      WHERE slug = ${slug as string}
        AND status = 'active'
      LIMIT 1
    `;

    if (clientResult.length === 0) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    const client = clientResult[0];

    // 2. Obtener el evento con todos sus campos incluyendo configuración avanzada
    const eventoResult = await sql`
      SELECT id, nombre, duracion_minutos, precio, modalidad, activo,
             buffer_despues, antelacion_minima, max_por_dia
      FROM eventos
      WHERE id = ${evento_id as string}
        AND client_id = ${client.id}
        AND activo = true
      LIMIT 1
    `;

    if (eventoResult.length === 0) {
      return res.status(404).json({ error: 'Tipo de evento no encontrado' });
    }

    const evento = eventoResult[0];
    const duracion = evento.duracion_minutos as number;
    const bufferDespues = (evento.buffer_despues as number) || 0;
    const antelacionMinima = (evento.antelacion_minima as number) || 0;
    const maxPorDia = evento.max_por_dia as number | null;

    // 3. Verificar máximo de turnos por día
    if (maxPorDia !== null && maxPorDia > 0) {
      const bookingCount = await sql`
        SELECT COUNT(*)::int as count
        FROM bookings
        WHERE evento_id = ${evento.id}
          AND DATE(fecha_hora AT TIME ZONE 'America/Argentina/Buenos_Aires') = ${dateStr}
          AND estado NOT IN ('cancelled')
      `;
      const count = (bookingCount[0]?.count as number) || 0;
      if (count >= maxPorDia) {
        return res.status(200).json({
          slots: [],
          mensaje: `Límite de ${maxPorDia} turnos por día alcanzado`,
        });
      }
    }

    // 4. Determinar el día de la semana (0=Dom, 1=Lun, ..., 6=Sab)
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const diaSemana = dateObj.getDay();

    // 5. Obtener todos los bloques de disponibilidad del evento para ese día
    const disponibilidadResult = await sql`
      SELECT hora_inicio, hora_fin
      FROM disponibilidad
      WHERE evento_id = ${evento.id}
        AND dia_semana = ${diaSemana}
      ORDER BY hora_inicio ASC
    `;

    if (disponibilidadResult.length === 0) {
      return res.status(200).json({ slots: [], mensaje: 'Sin disponibilidad para este día' });
    }

    // 6. Generar slots potenciales de todos los bloques del día
    const potentialSlots: { start: string; end: string; label: string }[] = [];

    for (const bloque of disponibilidadResult) {
      const horaInicio = (bloque.hora_inicio as string).substring(0, 5);
      const horaFin = (bloque.hora_fin as string).substring(0, 5);
      const inicioMin = timeToMinutes(horaInicio);
      const finMin = timeToMinutes(horaFin);

      for (let m = inicioMin; m + duracion <= finMin; m += duracion + bufferDespues) {
        const startTime = minutesToTime(m);
        const endTime = minutesToTime(m + duracion);
        potentialSlots.push({
          start: toArgentinaISO(dateStr, startTime),
          end: toArgentinaISO(dateStr, endTime),
          label: startTime,
        });
      }
    }

    if (potentialSlots.length === 0) {
      return res.status(200).json({ slots: [] });
    }

    // 7. Filtrar por antelación mínima
    // Calcular "ahora + antelacion_minima" en hora Argentina (UTC-3)
    const nowUTC = new Date();
    const cutoffTime = new Date(nowUTC.getTime() + antelacionMinima * 60 * 1000);

    const nowArgentinaMs = nowUTC.getTime() - 3 * 60 * 60 * 1000;
    const todayArgentina = new Date(nowArgentinaMs).toISOString().substring(0, 10);
    const isToday = dateStr === todayArgentina;

    const futurePotentialSlots = isToday
      ? potentialSlots.filter(slot => new Date(slot.start).getTime() > cutoffTime.getTime())
      : potentialSlots;

    if (futurePotentialSlots.length === 0) {
      return res.status(200).json({ slots: [] });
    }

    // 8. Filtrar slots ya reservados en la BD (pending o confirmados)
    // Previene doble-reserva durante el período de pago pendiente (sin GC event aún)
    const existingBookings = await sql`
      SELECT fecha_hora
      FROM bookings
      WHERE client_id = ${client.id}
        AND estado NOT IN ('cancelled')
        AND fecha_hora >= ${futurePotentialSlots[0].start}
        AND fecha_hora <= ${futurePotentialSlots[futurePotentialSlots.length - 1].start}
    `;

    const bookedMs = new Set(
      existingBookings.map(b => new Date(b.fecha_hora as string).getTime())
    );

    const availableSlots = futurePotentialSlots.filter(
      slot => !bookedMs.has(new Date(slot.start).getTime())
    );

    // 9. Filtrar por Google Calendar FreeBusy (con buffers)
    // El buffer se aplica UNA sola vez al slot candidato (no a ambos lados)
    let freeSlots = availableSlots;

    if (client.google_refresh_token) {
      try {
        const accessToken = await getValidAccessToken(client as any);
        const calendarId = client.google_calendar_id || 'primary';

        // Rango de consulta = inicio del primer bloque hasta fin del último
        const primerBloque = disponibilidadResult[0];
        const ultimoBloque = disponibilidadResult[disponibilidadResult.length - 1];
        const horaInicioConsulta = (primerBloque.hora_inicio as string).substring(0, 5);
        const horaFinConsulta = (ultimoBloque.hora_fin as string).substring(0, 5);
        const timeMin = toArgentinaISO(dateStr, horaInicioConsulta);
        const timeMax = toArgentinaISO(dateStr, horaFinConsulta);

        const busySlots = await getFreeBusy(accessToken, calendarId, timeMin, timeMax);

        // Un slot es libre si su tiempo real (sin buffers) no se superpone con ningún busy
        freeSlots = availableSlots.filter(slot => {
          const slotStart = new Date(slot.start).getTime();
          const slotEnd = new Date(slot.end).getTime();

          return !busySlots.some(busy => {
            const busyStart = new Date(busy.start).getTime();
            const busyEnd = new Date(busy.end).getTime();
            return slotStart < busyEnd && slotEnd > busyStart;
          });
        });
      } catch (googleError: any) {
        console.warn('Google Calendar FreeBusy falló, mostrando slots sin filtrar:', googleError.message);
      }
    }

    return res.status(200).json({
      slots: freeSlots.map(s => ({ start: s.start, label: s.label })),
      evento: {
        id: evento.id,
        nombre: evento.nombre,
        duracion_minutos: evento.duracion_minutos,
        precio: evento.precio,
        modalidad: evento.modalidad,
      },
    });

  } catch (error: any) {
    console.error('Error en /api/slots:', error);
    return res.status(500).json({ error: 'Error al obtener disponibilidad', details: error.message });
  }
}
