// pages/api/client-login.ts
// Login del médico con email + contraseña

import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyClientCredentials, createClientSession } from '../../lib/auth/client-auth';
import { serialize } from 'cookie';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    const client = await verifyClientCredentials(email, password);

    if (!client) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    if (client.status === 'pending_payment') {
      // Tiene cuenta pero no pagó — mandarlo a verificar pago
      return res.status(200).json({ redirect: `/success?client_id=${client.id}` });
    }

    if (client.status !== 'active') {
      return res.status(401).json({ error: 'Tu cuenta no está activa. Contactá soporte.' });
    }

    // Crear sesión (cookie httpOnly via Pages Router)
    const sessionData = JSON.stringify({
      id: client.id,
      email: client.email,
      slug: client.slug,
      nombre_completo: client.nombre_completo,
      status: client.status,
    });

    const cookie = serialize('client_session', sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 días
      path: '/',
    });

    res.setHeader('Set-Cookie', cookie);

    return res.status(200).json({ success: true, redirect: '/panel' });
  } catch (error: any) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}
