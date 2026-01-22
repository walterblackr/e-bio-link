// API endpoint para configurar automáticamente el calendario del cliente
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { neon } from '@neondatabase/serverless';

// Función para validar sesión de cliente activo
async function requireActiveClient(req: NextApiRequest): Promise<any> {
  const sessionCookie = req.cookies.client_session;

  if (!sessionCookie) {
    throw new Error('No autorizado');
  }

  try {
    const session = JSON.parse(sessionCookie);

    if (!session.id || !session.email) {
      throw new Error('Sesión inválida');
    }

    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`
      SELECT * FROM clients WHERE id = ${session.id} AND status = 'active' LIMIT 1
    `;

    if (result.length === 0) {
      throw new Error('Cliente no encontrado o inactivo');
    }

    return result[0];
  } catch {
    throw new Error('Error de autenticación');
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validar autenticación
    const client = await requireActiveClient(req);

    // Verificar que el cliente tenga API key
    if (!client.cal_api_key) {
      return res.status(400).json({
        error: 'No hay API Key de Cal.com configurada',
      });
    }

    const apiKey = client.cal_api_key;

    // Obtener event types existentes
    let existingEventTypes: any[] = [];

    try {
      const eventTypesResponse = await axios.get(
        'https://api.cal.com/v2/event-types',
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'cal-api-version': '2024-08-13',
          },
          timeout: 10000,
        }
      );

      existingEventTypes = eventTypesResponse.data.data || [];
    } catch (error) {
      console.warn('No se pudieron obtener event types existentes:', error);
    }

    // Verificar si ya existe un event type llamado "Consulta"
    const hasConsulta = existingEventTypes.some(
      (et: any) => et.title === 'Consulta' || et.title === 'Consulta Médica'
    );

    let eventTypeId = null;

    // Si no existe, crear event type "Consulta"
    if (!hasConsulta) {
      try {
        const createEventTypeResponse = await axios.post(
          'https://api.cal.com/v2/event-types',
          {
            lengthInMinutes: 30,
            title: 'Consulta',
            description: 'Consulta profesional de 30 minutos',
            slug: 'consulta',
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'cal-api-version': '2024-08-13',
            },
            timeout: 10000,
          }
        );

        eventTypeId = createEventTypeResponse.data.data?.id;
        console.log('Event type "Consulta" creado:', eventTypeId);

      } catch (error: any) {
        console.warn('Warning al crear event type:', error.response?.data || error.message);
        // No es crítico, continuar
      }
    } else {
      console.log('Event type "Consulta" ya existe');
    }

    // Actualizar configuración en base de datos si se creó el event type
    if (eventTypeId) {
      const sql = neon(process.env.DATABASE_URL!);
      await sql`
        UPDATE clients
        SET cal_event_type_id = ${eventTypeId}, updated_at = NOW()
        WHERE id = ${client.id}
      `;
    }

    return res.status(200).json({
      success: true,
      message: 'Calendario configurado correctamente',
      eventTypeId: eventTypeId || existingEventTypes[0]?.id || null,
    });

  } catch (error: any) {
    console.error('Error en calcom/setup-calendar:', error);
    return res.status(500).json({
      error: error.message || 'Error al configurar calendario',
    });
  }
}
