// pages/api/debug-session.ts
// Endpoint temporal para debuggear sesiones
// ELIMINAR después de resolver el problema

import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { sessionId, adminKey } = req.query;

  // Proteger con admin key
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);

    if (sessionId) {
      // Buscar sesión específica
      const session = await sql`
        SELECT * FROM oauth_sessions WHERE session_id = ${sessionId}
      `;

      return res.json({
        sessionId,
        found: session.length > 0,
        session: session[0] || null,
      });
    } else {
      // Listar todas las sesiones
      const sessions = await sql`
        SELECT session_id, user_id, client_name, status, created_at
        FROM oauth_sessions
        ORDER BY created_at DESC
        LIMIT 10
      `;

      const clients = await sql`
        SELECT id, user_id, client_name, created_at
        FROM clients
        ORDER BY created_at DESC
        LIMIT 10
      `;

      return res.json({
        sessions,
        clients,
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
}
