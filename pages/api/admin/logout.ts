// API de logout para administradores
import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Destruir sesión (eliminar cookie)
    const cookie = serialize('admin_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expira inmediatamente
      path: '/',
    });

    res.setHeader('Set-Cookie', cookie);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error en logout:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
