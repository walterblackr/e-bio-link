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
        buffer_despues,
        antelacion_minima,
        max_por_dia,
        direccion,
        cobro_tipo,
        sena_monto,
      } = req.body;

      if (modalidad && !['virtual', 'presencial'].includes(modalidad)) {
        return res.status(400).json({
          error: 'Modalidad debe ser "virtual" o "presencial"'
        });
      }

      const cobro_tipo_val = cobro_tipo !== undefined ? cobro_tipo : (evento.cobro_tipo || 'total');
      if (!['total', 'sena'].includes(cobro_tipo_val)) {
        return res.status(400).json({ error: 'cobro_tipo debe ser "total" o "sena"' });
      }

      const precio_final = precio !== undefined ? Number(precio) : Number(evento.precio);
      let sena_monto_val: number | null = null;
      if (cobro_tipo_val === 'sena') {
        sena_monto_val = sena_monto !== undefined ? Number(sena_monto) : Number(evento.sena_monto);
        if (!sena_monto_val || sena_monto_val <= 0) {
          return res.status(400).json({ error: 'El monto de la seña debe ser mayor a 0' });
        }
        if (sena_monto_val >= precio_final) {
          return res.status(400).json({ error: 'El monto de la seña debe ser menor al precio total' });
        }
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
          buffer_despues = ${buffer_despues !== undefined ? buffer_despues : (evento.buffer_despues ?? 0)},
          antelacion_minima = ${antelacion_minima !== undefined ? antelacion_minima : (evento.antelacion_minima ?? 0)},
          max_por_dia = ${max_por_dia !== undefined ? max_por_dia : evento.max_por_dia},
          direccion = ${direccion !== undefined ? (direccion || null) : evento.direccion},
          cobro_tipo = ${cobro_tipo_val},
          sena_monto = ${sena_monto_val},
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
