// pages/api/booking-by-token.ts
// Endpoint público: devuelve los datos de una reserva dado su public_token.
// No requiere auth — el token es el único secreto necesario.
import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'token requerido' });
  }

  const rows = await sql`
    SELECT
      b.id,
      b.public_token,
      b.estado,
      b.fecha_hora,
      b.monto,
      b.expires_at,
      b.payment_method,
      b.paciente_nombre,
      e.nombre       AS evento_nombre,
      e.modalidad,
      e.direccion,
      e.cobro_tipo,
      e.sena_monto,
      e.precio       AS precio_total,
      c.slug,
      c.nombre_completo,
      c.cbu_alias,
      c.banco_nombre,
      c.titular_cuenta,
      c.payment_window_minutes
    FROM bookings b
    JOIN clients c ON c.id = b.client_id
    LEFT JOIN eventos e ON e.id = b.evento_id
    WHERE b.public_token = ${token}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Reserva no encontrada' });
  }

  return res.status(200).json({ booking: rows[0] });
}
