// pages/api/disponibilidad/index.ts
// CRUD de horarios de disponibilidad por día de semana

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

    // GET - Listar disponibilidad del cliente
    if (req.method === 'GET') {
      const disponibilidad = await sql`
        SELECT id, dia_semana, hora_inicio, hora_fin, activo
        FROM disponibilidad
        WHERE client_id = ${client.id}
        ORDER BY dia_semana ASC
      `;

      return res.status(200).json({ disponibilidad });
    }

    // POST - Guardar/actualizar disponibilidad (upsert de todos los días)
    if (req.method === 'POST') {
      const { dias } = req.body;

      // Espera un array de: [{ dia_semana: 1, hora_inicio: "09:00", hora_fin: "17:00", activo: true }, ...]
      if (!Array.isArray(dias)) {
        return res.status(400).json({ error: 'Se espera un array de días en el campo "dias"' });
      }

      // Validar cada día
      for (const dia of dias) {
        if (dia.dia_semana < 0 || dia.dia_semana > 6) {
          return res.status(400).json({ error: `dia_semana inválido: ${dia.dia_semana}` });
        }
        if (dia.activo && (!dia.hora_inicio || !dia.hora_fin)) {
          return res.status(400).json({ error: `Horarios requeridos para día ${dia.dia_semana}` });
        }
        if (dia.activo && dia.hora_inicio >= dia.hora_fin) {
          return res.status(400).json({ error: `hora_inicio debe ser menor a hora_fin para día ${dia.dia_semana}` });
        }
      }

      // Upsert: insertar o actualizar cada día
      for (const dia of dias) {
        await sql`
          INSERT INTO disponibilidad (client_id, dia_semana, hora_inicio, hora_fin, activo)
          VALUES (
            ${client.id},
            ${dia.dia_semana},
            ${dia.hora_inicio || '09:00'},
            ${dia.hora_fin || '17:00'},
            ${dia.activo ?? false}
          )
          ON CONFLICT (client_id, dia_semana)
          DO UPDATE SET
            hora_inicio = ${dia.hora_inicio || '09:00'},
            hora_fin = ${dia.hora_fin || '17:00'},
            activo = ${dia.activo ?? false},
            updated_at = NOW()
        `;
      }

      return res.status(200).json({
        success: true,
        message: 'Disponibilidad guardada correctamente',
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    console.error('Error en /api/disponibilidad:', error);

    if (error.message === 'No autorizado' || error.message === 'Cuenta no activa - pago pendiente') {
      return res.status(401).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
}
