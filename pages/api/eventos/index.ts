// pages/api/eventos/index.ts
// Endpoints para listar y crear eventos del cliente

import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { requireActiveClientFromRequest } from '../../../lib/auth/client-auth';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const client = await requireActiveClientFromRequest(req);
    const sql = neon(process.env.DATABASE_URL!);

    // GET - Listar todos los eventos del cliente
    if (req.method === 'GET') {
      const eventos = await sql`
        SELECT
          id,
          nombre,
          descripcion,
          cal_event_type_id,
          cal_slug,
          duracion_minutos,
          precio,
          activo,
          created_at,
          updated_at
        FROM eventos
        WHERE client_id = ${client.id}
        ORDER BY created_at DESC
      `;

      return res.status(200).json({ eventos });
    }

    // POST - Crear nuevo evento
    if (req.method === 'POST') {
      const {
        nombre,
        descripcion,
        duracion_minutos,
        precio,
      } = req.body;

      // Validaciones
      if (!nombre || !duracion_minutos || !precio) {
        return res.status(400).json({
          error: 'Campos requeridos: nombre, duracion_minutos, precio'
        });
      }

      if (!client.cal_api_key) {
        return res.status(400).json({
          error: 'Primero debes conectar tu cuenta de Cal.com'
        });
      }

      // Generar slug único basado en el nombre
      const baseSlug = nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Crear event type en Cal.com
      try {
        const calResponse = await axios.post(
          'https://api.cal.com/v2/event-types',
          {
            lengthInMinutes: duracion_minutos,
            title: nombre,
            slug: baseSlug,
            description: descripcion || '',
            // Configuración del redirect después del booking
            successRedirectUrl: 'https://e-bio-link.vercel.app/pagar',
            // Requiere confirmación manual del profesional
            requiresConfirmation: true,
            // Campos del formulario de booking
            bookingFields: [
              {
                type: 'name',
                label: 'Nombre completo',
                required: true,
                placeholder: 'Juan Pérez',
              },
              {
                type: 'email',
                label: 'Correo electrónico',
                required: true,
                placeholder: 'juan@example.com',
              },
              {
                type: 'phone',
                slug: 'telefono',
                label: 'Número de teléfono',
                required: true,
                placeholder: '+54 9 11 1234-5678',
              },
              {
                type: 'textarea',
                slug: 'notas',
                label: 'Notas adicionales',
                required: false,
                placeholder: 'Información adicional (opcional)',
              },
            ],
          },
          {
            headers: {
              'Authorization': `Bearer ${client.cal_api_key}`,
              'Content-Type': 'application/json',
              'cal-api-version': '2024-06-14',
            },
          }
        );

        const calEventType = calResponse.data.data;

        // Guardar en nuestra base de datos
        const result = await sql`
          INSERT INTO eventos (
            client_id,
            nombre,
            descripcion,
            cal_event_type_id,
            cal_slug,
            duracion_minutos,
            precio,
            activo
          ) VALUES (
            ${client.id},
            ${nombre},
            ${descripcion || ''},
            ${calEventType.id},
            ${calEventType.slug},
            ${duracion_minutos},
            ${precio},
            true
          )
          RETURNING *
        `;

        return res.status(201).json({
          success: true,
          evento: result[0],
        });

      } catch (error: any) {
        console.error('Error creando event type en Cal.com:', JSON.stringify(error.response?.data, null, 2) || error.message);

        if (axios.isAxiosError(error)) {
          return res.status(500).json({
            error: 'Error al crear el evento en Cal.com',
            details: error.response?.data || error.message,
          });
        }

        throw error;
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('Error en /api/eventos:', error);

    if (error.message === 'No autorizado' || error.message === 'Cuenta no activa - pago pendiente') {
      return res.status(401).json({ error: error.message });
    }

    return res.status(500).json({
      error: 'Error al procesar la solicitud',
      details: error.message
    });
  }
}
