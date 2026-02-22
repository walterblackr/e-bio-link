// pages/api/eventos/index.ts
// Endpoints para listar y crear eventos del cliente

import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { requireActiveClientFromRequest } from '../../../lib/auth/client-auth';

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
          duracion_minutos,
          precio,
          modalidad,
          activo,
          created_at
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
        modalidad,
      } = req.body;

      // Validaciones
      if (!nombre || !duracion_minutos || !precio) {
        return res.status(400).json({
          error: 'Campos requeridos: nombre, duracion_minutos, precio'
        });
      }

      if (modalidad && !['virtual', 'presencial'].includes(modalidad)) {
        return res.status(400).json({
          error: 'Modalidad debe ser "virtual" o "presencial"'
        });
      }

      // Guardar en nuestra base de datos
      const result = await sql`
        INSERT INTO eventos (
          client_id,
          nombre,
          descripcion,
          duracion_minutos,
          precio,
          modalidad,
          activo
        ) VALUES (
          ${client.id},
          ${nombre},
          ${descripcion || ''},
          ${duracion_minutos},
          ${precio},
          ${modalidad || 'virtual'},
          true
        )
        RETURNING *
      `;

      return res.status(201).json({
        success: true,
        evento: result[0],
      });
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
