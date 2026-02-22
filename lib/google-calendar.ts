// Librería utilitaria para Google Calendar API
// Usa axios (ya instalado) para llamadas HTTP directas - NO usa googleapis (40MB)

import axios from 'axios';
import { neon } from '@neondatabase/serverless';
import { encrypt, decrypt } from './encryption';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

// ============================================================
// Token Management
// ============================================================

/**
 * Obtiene un access token válido para un cliente.
 * Si el token expiró, lo refresca automáticamente y actualiza la BD.
 */
export async function getValidAccessToken(client: {
  id: string;
  google_access_token: string;
  google_refresh_token: string;
  google_token_expiry: string;
}): Promise<string> {
  const now = new Date();
  const expiry = new Date(client.google_token_expiry);

  // Si el token aún es válido (con 5 min de margen), usarlo
  if (expiry.getTime() - now.getTime() > 5 * 60 * 1000) {
    return decrypt(client.google_access_token);
  }

  // Token expirado o por expirar, refrescar
  const refreshToken = decrypt(client.google_refresh_token);
  const newTokens = await refreshAccessToken(refreshToken);

  // Actualizar en BD
  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    UPDATE clients
    SET
      google_access_token = ${encrypt(newTokens.access_token)},
      google_token_expiry = ${new Date(Date.now() + newTokens.expires_in * 1000).toISOString()},
      updated_at = NOW()
    WHERE id = ${client.id}
  `;

  return newTokens.access_token;
}

/**
 * Refresca un access token usando el refresh token.
 */
async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const response = await axios.post('https://oauth2.googleapis.com/token', null, {
    params: {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    },
  });

  return response.data;
}

// ============================================================
// FreeBusy (Disponibilidad)
// ============================================================

interface BusySlot {
  start: string;
  end: string;
}

/**
 * Consulta los slots ocupados en Google Calendar para un rango de tiempo.
 * Retorna un array de { start, end } con los periodos ocupados.
 */
export async function getFreeBusy(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string
): Promise<BusySlot[]> {
  const response = await axios.post(
    'https://www.googleapis.com/calendar/v3/freeBusy',
    {
      timeMin,
      timeMax,
      timeZone: 'America/Argentina/Buenos_Aires',
      items: [{ id: calendarId }],
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data.calendars[calendarId]?.busy || [];
}

// ============================================================
// Event Management
// ============================================================

interface CreateEventData {
  booking_id: number | string;
  titulo: string;
  descripcion: string;
  fecha_hora: string; // ISO 8601
  fecha_hora_fin: string; // ISO 8601
  paciente_nombre: string;
  paciente_email: string;
  paciente_telefono: string;
  modalidad: 'virtual' | 'presencial';
  notas?: string;
}

interface CreatedEvent {
  google_event_id: string;
  meet_link: string | null;
  html_link: string;
}

/**
 * Crea un evento en Google Calendar.
 * Si la modalidad es 'virtual', genera automáticamente un link de Google Meet.
 */
export async function createEvent(
  accessToken: string,
  calendarId: string,
  data: CreateEventData
): Promise<CreatedEvent> {
  const eventBody: Record<string, any> = {
    summary: data.titulo,
    description: [
      `Paciente: ${data.paciente_nombre}`,
      `Email: ${data.paciente_email}`,
      `Tel: ${data.paciente_telefono}`,
      data.notas ? `Notas: ${data.notas}` : '',
    ].filter(Boolean).join('\n'),
    start: {
      dateTime: data.fecha_hora,
      timeZone: 'America/Argentina/Buenos_Aires',
    },
    end: {
      dateTime: data.fecha_hora_fin,
      timeZone: 'America/Argentina/Buenos_Aires',
    },
    attendees: [
      { email: data.paciente_email },
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 60 },
        { method: 'popup', minutes: 15 },
      ],
    },
  };

  // Agregar Google Meet si es virtual
  if (data.modalidad === 'virtual') {
    eventBody.conferenceData = {
      createRequest: {
        requestId: `booking-${data.booking_id}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };
  }

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
  const params = data.modalidad === 'virtual' ? { conferenceDataVersion: 1 } : {};

  const response = await axios.post(url, eventBody, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    params,
  });

  const event = response.data;

  // Obtener Meet link (puede estar en hangoutLink o conferenceData.entryPoints)
  let meetLink = event.hangoutLink || null;
  if (!meetLink && event.conferenceData?.entryPoints) {
    const videoEntry = event.conferenceData.entryPoints.find(
      (ep: any) => ep.entryPointType === 'video'
    );
    meetLink = videoEntry?.uri || null;
  }

  return {
    google_event_id: event.id,
    meet_link: meetLink,
    html_link: event.htmlLink,
  };
}

/**
 * Elimina (cancela) un evento de Google Calendar.
 */
export async function deleteEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<void> {
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;

  await axios.delete(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

// ============================================================
// Helper: Obtener tokens y crear evento (flujo completo)
// ============================================================

/**
 * Flujo completo: obtiene token válido y crea evento.
 * Uso principal desde webhooks y confirmación de turnos.
 */
export async function createEventForClient(
  clientId: string,
  eventData: CreateEventData
): Promise<CreatedEvent> {
  const sql = neon(process.env.DATABASE_URL!);

  const clients = await sql`
    SELECT id, google_access_token, google_refresh_token, google_token_expiry, google_calendar_id
    FROM clients
    WHERE id = ${clientId}
    LIMIT 1
  `;

  if (clients.length === 0) {
    throw new Error('Cliente no encontrado');
  }

  const client = clients[0];

  if (!client.google_refresh_token) {
    throw new Error('Cliente no tiene Google Calendar conectado');
  }

  const accessToken = await getValidAccessToken(client as any);
  const calendarId = client.google_calendar_id || 'primary';

  return createEvent(accessToken, calendarId, eventData);
}

/**
 * Flujo completo: obtiene token válido y elimina evento.
 */
export async function deleteEventForClient(
  clientId: string,
  googleEventId: string
): Promise<void> {
  const sql = neon(process.env.DATABASE_URL!);

  const clients = await sql`
    SELECT id, google_access_token, google_refresh_token, google_token_expiry, google_calendar_id
    FROM clients
    WHERE id = ${clientId}
    LIMIT 1
  `;

  if (clients.length === 0) {
    throw new Error('Cliente no encontrado');
  }

  const client = clients[0];

  if (!client.google_refresh_token) {
    throw new Error('Cliente no tiene Google Calendar conectado');
  }

  const accessToken = await getValidAccessToken(client as any);
  const calendarId = client.google_calendar_id || 'primary';

  await deleteEvent(accessToken, calendarId, googleEventId);
}
