// pages/api/mis-turnos.ts
// Retorna todos los turnos del médico logueado

import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { requireActiveClientFromRequest } from '../../lib/auth/client-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await requireActiveClientFromRequest(req);
    const sql = neon(process.env.DATABASE_URL!);

    const bookings = await sql`
      SELECT
        b.id,
        b.paciente_nombre,
        b.paciente_email,
        b.paciente_telefono,
        b.fecha_hora,
        b.monto,
        b.estado,
        b.payment_method,
        b.comprobante_url,
        b.notas,
        b.meet_link,
        b.created_at,
        e.nombre AS evento_nombre,
        e.modalidad
      FROM bookings b
      LEFT JOIN eventos e ON b.evento_id = e.id
      WHERE b.client_id = ${session.id}
      ORDER BY b.fecha_hora DESC
      LIMIT 50
    `;

    return res.status(200).json({ bookings });
  } catch (error: any) {
    if (error.message === 'No autorizado' || error.message === 'Cuenta no activa - pago pendiente') {
      return res.status(401).json({ error: 'No autorizado' });
    }
    console.error('Error obteniendo turnos:', error);
    return res.status(500).json({ error: 'Error al obtener turnos' });
  }
}
