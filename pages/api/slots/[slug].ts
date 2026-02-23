// pages/api/slots/[slug].ts
// Endpoint público: retorna slots disponibles para un profesional en una fecha dada
// Query params: ?date=YYYY-MM-DD&evento_id=X

import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { getValidAccessToken, getFreeBusy } from '../../../lib/google-calendar';

// Argentina siempre es UTC-3 (no tiene horario de verano)
const TZ_OFFSET = '-03:00';

function toArgentinaISO(date: string, time: string): string {
  // date = "YYYY-MM-DD", time = "HH:MM"
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

  // Validar formato de fecha
  const dateStr = date as string;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return res.status(400).json({ error: 'Formato de fecha inválido. Use YYYY-MM-DD' });
  }

  // No permitir fechas pasadas
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

    // 2. Obtener el evento y su duración
    const eventoResult = await sql`
      SELECT id, nombre, duracion_minutos, precio, modalidad, activo
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

    // 3. Determinar el día de la semana (0=Dom, 1=Lun, ..., 6=Sab)
    // La fecha "YYYY-MM-DD" con T00:00:00 es medianoche local, pero para
    // determinar el día de semana correctamente usamos el string directamente
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day); // local time, no UTC
    const diaSemana = dateObj.getDay(); // 0=Sunday

    // 4. Obtener disponibilidad para ese día
    const disponibilidadResult = await sql`
      SELECT hora_inicio, hora_fin, activo
      FROM disponibilidad
      WHERE client_id = ${client.id}
        AND dia_semana = ${diaSemana}
      LIMIT 1
    `;

    if (disponibilidadResult.length === 0 || !disponibilidadResult[0].activo) {
      return res.status(200).json({ slots: [], mensaje: 'Sin disponibilidad para este día' });
    }

    const disp = disponibilidadResult[0];
    const horaInicio = (disp.hora_inicio as string).substring(0, 5); // "HH:MM"
    const horaFin = (disp.hora_fin as string).substring(0, 5);

    // 5. Generar todos los slots potenciales
    const inicioMin = timeToMinutes(horaInicio);
    const finMin = timeToMinutes(horaFin);
    const potentialSlots: { start: string; end: string; label: string }[] = [];

    for (let m = inicioMin; m + duracion <= finMin; m += duracion) {
      const startTime = minutesToTime(m);
      const endTime = minutesToTime(m + duracion);
      potentialSlots.push({
        start: toArgentinaISO(dateStr, startTime),
        end: toArgentinaISO(dateStr, endTime),
        label: startTime,
      });
    }

    if (potentialSlots.length === 0) {
      return res.status(200).json({ slots: [] });
    }

    // 6. Filtrar slots pasados si es hoy
    // Argentina = UTC-3 (fijo, sin DST)
    const nowUTC = new Date();
    const nowArgentinaMs = nowUTC.getTime() - 3 * 60 * 60 * 1000;
    const todayArgentina = new Date(nowArgentinaMs).toISOString().substring(0, 10);
    const isToday = dateStr === todayArgentina;

    const futurePotentialSlots = isToday
      ? potentialSlots.filter(slot => new Date(slot.start).getTime() > nowUTC.getTime())
      : potentialSlots;

    if (futurePotentialSlots.length === 0) {
      return res.status(200).json({ slots: [] });
    }

    // 7. Consultar Google Calendar FreeBusy (solo si tiene Google Calendar conectado)
    let freeSlots = futurePotentialSlots;

    if (client.google_refresh_token) {
      try {
        const accessToken = await getValidAccessToken(client as any);
        const calendarId = client.google_calendar_id || 'primary';
        const timeMin = toArgentinaISO(dateStr, horaInicio);
        const timeMax = toArgentinaISO(dateStr, horaFin);

        const busySlots = await getFreeBusy(accessToken, calendarId, timeMin, timeMax);

        // 8. Filtrar slots ocupados
        freeSlots = futurePotentialSlots.filter(slot => {
          const slotStart = new Date(slot.start).getTime();
          const slotEnd = new Date(slot.end).getTime();
          return !busySlots.some(busy => {
            const busyStart = new Date(busy.start).getTime();
            const busyEnd = new Date(busy.end).getTime();
            return slotStart < busyEnd && slotEnd > busyStart;
          });
        });
      } catch (googleError: any) {
        // Si Google Calendar falla (token inválido/expirado), devolvemos
        // todos los slots de disponibilidad sin filtrar por calendario.
        // El médico deberá reconectar Google Calendar desde su perfil.
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
