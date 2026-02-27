// pages/api/disponibilidad/index.ts
// CRUD de horarios de disponibilidad por evento
// Cada evento tiene su propio conjunto de bloques horarios por día

import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { requireActiveClientFromRequest } from '../../../lib/auth/client-auth';

interface BloqueHorario {
  hora_inicio: string; // "HH:MM"
  hora_fin: string;    // "HH:MM"
}

interface DiaConBloques {
  dia_semana: number;       // 0=Dom, 1=Lun, ..., 6=Sab
  activo: boolean;
  bloques: BloqueHorario[]; // puede ser vacío si activo=false
}

function bloquesSeSuperponen(bloques: BloqueHorario[]): boolean {
  const sorted = [...bloques].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].hora_fin > sorted[i + 1].hora_inicio) return true;
  }
  return false;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const client = await requireActiveClientFromRequest(req);
    const sql = neon(process.env.DATABASE_URL!);

    // GET — Listar disponibilidad de un evento
    if (req.method === 'GET') {
      const { evento_id } = req.query;

      if (!evento_id) {
        return res.status(400).json({ error: 'evento_id requerido' });
      }

      // Verificar que el evento pertenece al cliente
      const eventoCheck = await sql`
        SELECT id FROM eventos WHERE id = ${evento_id as string} AND client_id = ${client.id} LIMIT 1
      `;
      if (eventoCheck.length === 0) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }

      const rows = await sql`
        SELECT id, dia_semana, hora_inicio, hora_fin, activo
        FROM disponibilidad
        WHERE evento_id = ${evento_id as string}
        ORDER BY dia_semana ASC, hora_inicio ASC
      `;

      // Agrupar bloques por día de semana
      const diasMap: Record<number, DiaConBloques> = {};
      for (const row of rows) {
        const dia = row.dia_semana as number;
        if (!diasMap[dia]) {
          diasMap[dia] = { dia_semana: dia, activo: row.activo as boolean, bloques: [] };
        }
        diasMap[dia].bloques.push({
          hora_inicio: (row.hora_inicio as string).substring(0, 5),
          hora_fin: (row.hora_fin as string).substring(0, 5),
        });
      }

      return res.status(200).json({ disponibilidad: Object.values(diasMap) });
    }

    // POST — Guardar disponibilidad de un evento (reemplaza todo)
    if (req.method === 'POST') {
      const { evento_id, dias } = req.body as { evento_id: string; dias: DiaConBloques[] };

      if (!evento_id) {
        return res.status(400).json({ error: 'evento_id requerido' });
      }

      if (!Array.isArray(dias)) {
        return res.status(400).json({ error: 'Se espera un array de días en el campo "dias"' });
      }

      // Verificar que el evento pertenece al cliente
      const eventoCheck = await sql`
        SELECT id FROM eventos WHERE id = ${evento_id} AND client_id = ${client.id} LIMIT 1
      `;
      if (eventoCheck.length === 0) {
        return res.status(404).json({ error: 'Evento no encontrado' });
      }

      // Validar cada día
      for (const dia of dias) {
        if (dia.dia_semana < 0 || dia.dia_semana > 6) {
          return res.status(400).json({ error: `dia_semana inválido: ${dia.dia_semana}` });
        }

        if (!dia.activo) continue;

        if (!dia.bloques || dia.bloques.length === 0) {
          return res.status(400).json({ error: `Día ${dia.dia_semana} está activo pero no tiene bloques horarios` });
        }

        for (const bloque of dia.bloques) {
          if (!bloque.hora_inicio || !bloque.hora_fin) {
            return res.status(400).json({ error: `Bloque incompleto en día ${dia.dia_semana}` });
          }
          if (bloque.hora_inicio >= bloque.hora_fin) {
            return res.status(400).json({ error: `hora_inicio debe ser menor a hora_fin en día ${dia.dia_semana}` });
          }
        }

        if (dia.bloques.length > 1 && bloquesSeSuperponen(dia.bloques)) {
          return res.status(400).json({ error: `Los bloques horarios del día ${dia.dia_semana} se superponen` });
        }
      }

      // Validar solapamiento con otros eventos del mismo cliente
      const diasActivos = dias.filter(d => d.activo && d.bloques?.length > 0);
      if (diasActivos.length > 0) {
        const diasNums = diasActivos.map(d => d.dia_semana);

        const otrosBloquesRaw = await sql`
          SELECT dia_semana, hora_inicio, hora_fin
          FROM disponibilidad
          WHERE client_id = ${client.id}
            AND evento_id != ${evento_id}
            AND evento_id IS NOT NULL
            AND dia_semana = ANY(${diasNums}::int[])
        `;

        const DIAS_NOMBRE = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

        for (const dia of diasActivos) {
          const otrosEnEseDia = otrosBloquesRaw
            .filter(r => r.dia_semana === dia.dia_semana)
            .map(r => ({
              hora_inicio: (r.hora_inicio as string).substring(0, 5),
              hora_fin: (r.hora_fin as string).substring(0, 5),
            }));

          if (otrosEnEseDia.length === 0) continue;

          const todosCombinados = [...dia.bloques, ...otrosEnEseDia];
          if (bloquesSeSuperponen(todosCombinados)) {
            return res.status(409).json({
              error: `Los horarios del ${DIAS_NOMBRE[dia.dia_semana]} se superponen con otro tipo de consulta ya configurado. Ajustá los bloques para que no se pisen.`,
            });
          }
        }
      }

      // Reemplazar todos los bloques del evento
      await sql`DELETE FROM disponibilidad WHERE evento_id = ${evento_id} AND client_id = ${client.id}`;

      for (const dia of dias) {
        if (!dia.activo || !dia.bloques || dia.bloques.length === 0) continue;

        for (const bloque of dia.bloques) {
          await sql`
            INSERT INTO disponibilidad (client_id, evento_id, dia_semana, hora_inicio, hora_fin, activo)
            VALUES (${client.id}, ${evento_id}, ${dia.dia_semana}, ${bloque.hora_inicio}, ${bloque.hora_fin}, true)
          `;
        }
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
