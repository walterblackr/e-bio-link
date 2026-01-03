// API de login para administradores
import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
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
    const { email, password } = req.body;

    // Validar campos
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Conectar a BD
    const sql = neon(process.env.DATABASE_URL!);

    // Buscar admin por email
    const result = await sql`
      SELECT id, email, password_hash, nombre, activo
      FROM admins
      WHERE email = ${email}
      LIMIT 1
    `;

    if (result.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const admin = result[0];

    // Verificar que esté activo
    if (!admin.activo) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, admin.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Crear sesión (cookie)
    const sessionData = JSON.stringify({
      id: admin.id,
      email: admin.email,
      nombre: admin.nombre,
    });

    const cookie = serialize('admin_session', sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/',
    });

    res.setHeader('Set-Cookie', cookie);

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
