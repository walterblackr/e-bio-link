// pages/api/panel/configuracion.ts
// GET  → lee la configuración del panel del profesional (incl. payment_window_minutes)
// POST → actualiza la ventana de pago
import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { requireActiveClientFromRequest } from '../../../lib/auth/client-auth';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await requireActiveClientFromRequest(req);

    if (req.method === 'GET') {
      const result = await sql`
        SELECT payment_window_minutes
        FROM clients
        WHERE id = ${client.id}
        LIMIT 1
      `;
      const win = result[0]?.payment_window_minutes ?? 120;
      return res.status(200).json({ payment_window_minutes: win });
    }

    if (req.method === 'POST') {
      const win = Number(req.body?.payment_window_minutes);
      if (!Number.isInteger(win) || win < 30 || win > 2880) {
        return res.status(400).json({ error: 'La ventana debe estar entre 30 minutos y 48 horas.' });
      }
      await sql`
        UPDATE clients SET payment_window_minutes = ${win}, updated_at = now()
        WHERE id = ${client.id}
      `;
      return res.status(200).json({ success: true, payment_window_minutes: win });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch {
    return res.status(401).json({ error: 'No autorizado' });
  }
}
