// API de logout para administradores
import type { NextApiRequest, NextApiResponse } from 'next';
import { destroyAdminSession } from '@/lib/auth/admin-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Destruir sesión
    await destroyAdminSession();

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error en logout:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
