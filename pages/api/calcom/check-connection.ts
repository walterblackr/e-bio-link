// API endpoint para verificar si el cliente tiene Cal.com conectado
import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';

// Función para validar sesión de cliente activo
async function requireActiveClient(req: NextApiRequest): Promise<any> {
  const sessionCookie = req.cookies.client_session;

  if (!sessionCookie) {
    throw new Error('No autorizado');
  }

  try {
    const session = JSON.parse(sessionCookie);

    if (!session.id || !session.email) {
      throw new Error('Sesión inválida');
    }

    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`
      SELECT * FROM clients WHERE id = ${session.id} AND status = 'active' LIMIT 1
    `;

    if (result.length === 0) {
      throw new Error('Cliente no encontrado o inactivo');
    }

    return result[0];
  } catch {
    throw new Error('Error de autenticación');
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = await requireActiveClient(req);

    // Verificar si tiene cal_api_key
    const connected = !!(client.cal_api_key && client.cal_api_key.length > 0);

    return res.status(200).json({
      connected,
      cal_username: client.cal_username || null,
    });

  } catch (error: any) {
    return res.status(401).json({
      error: error.message || 'No autorizado',
      connected: false,
    });
  }
}
