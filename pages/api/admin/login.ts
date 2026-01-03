// API de login para administradores
import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAdminCredentials, createAdminSession } from '@/lib/auth/admin-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // Validar campos
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Verificar credenciales
    const admin = await verifyAdminCredentials(email, password);

    if (!admin) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Crear sesión
    await createAdminSession(admin);

    // Retornar datos del admin (sin contraseña)
    return res.status(200).json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        nombre: admin.nombre,
      },
    });
  } catch (error: any) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
