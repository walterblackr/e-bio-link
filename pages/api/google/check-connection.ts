// pages/api/google/check-connection.ts
// Verifica si el cliente tiene Google Calendar conectado

import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { requireActiveClientFromRequest } from '../../../lib/auth/client-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = await requireActiveClientFromRequest(req);
    const sql = neon(process.env.DATABASE_URL!);

    const result = await sql`
      SELECT google_email, google_refresh_token
      FROM clients
      WHERE id = ${client.id}
      LIMIT 1
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const { google_email, google_refresh_token } = result[0];

    return res.status(200).json({
      connected: !!google_refresh_token,
      google_email: google_email || null,
    });
  } catch (error: any) {
    console.error('Error en /api/google/check-connection:', error);

    if (error.message === 'No autorizado' || error.message === 'Cuenta no activa - pago pendiente') {
      return res.status(401).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Error al verificar conexión' });
  }
}
