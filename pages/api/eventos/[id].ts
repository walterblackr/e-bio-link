// pages/api/eventos/[id].ts
// Endpoints para actualizar y eliminar eventos individuales

import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { requireActiveClientFromRequest } from '../../../lib/auth/client-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const client = await requireActiveClientFromRequest(req);
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'ID de evento requerido' });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Verificar que el evento pertenece al cliente
    const eventoExistente = await sql`
      SELECT * FROM eventos
      WHERE id = ${id} AND client_id = ${client.id}
      LIMIT 1
    `;

    if (eventoExistente.length === 0) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    const evento = eventoExistente[0];

    // PUT - Actualizar evento
    if (req.method === 'PUT') {
      const {
        nombre,
        descripcion,
        duracion_minutos,
        precio,
        modalidad,
        activo,
      } = req.body;

      if (modalidad && !['virtual', 'presencial'].includes(modalidad)) {
        return res.status(400).json({
          error: 'Modalidad debe ser "virtual" o "presencial"'
        });
      }

      const result = await sql`
        UPDATE eventos
        SET
          nombre = ${nombre || evento.nombre},
          descripcion = ${descripcion !== undefined ? descripcion : evento.descripcion},
          duracion_minutos = ${duracion_minutos || evento.duracion_minutos},
          precio = ${precio !== undefined ? precio : evento.precio},
          modalidad = ${modalidad || evento.modalidad || 'virtual'},
          activo = ${activo !== undefined ? activo : evento.activo},
          updated_at = NOW()
        WHERE id = ${id} AND client_id = ${client.id}
        RETURNING *
      `;

      return res.status(200).json({
        success: true,
        evento: result[0],
      });
    }

    // DELETE - Eliminar evento
    if (req.method === 'DELETE') {
      await sql`
        DELETE FROM eventos
        WHERE id = ${id} AND client_id = ${client.id}
      `;

      return res.status(200).json({
        success: true,
        message: 'Evento eliminado correctamente',
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('Error en /api/eventos/[id]:', error);

    if (error.message === 'No autorizado' || error.message === 'Cuenta no activa - pago pendiente') {
      return res.status(401).json({ error: error.message });
    }

    return res.status(500).json({
      error: 'Error al procesar la solicitud',
      details: error.message
    });
  }
}
