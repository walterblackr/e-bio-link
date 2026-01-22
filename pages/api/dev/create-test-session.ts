// Endpoint temporal para crear sesión de prueba sin registro
// ⚠️ SOLO PARA DESARROLLO - ELIMINAR EN PRODUCCIÓN

import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { serialize } from 'cookie';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email requerido' });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Buscar o crear cliente de prueba
    let client = await sql`
      SELECT id, email, slug, status
      FROM clients
      WHERE email = ${email}
      LIMIT 1
    `;

    if (client.length === 0) {
      // Crear cliente de prueba
      const slug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '-');

      client = await sql`
        INSERT INTO clients (
          email,
          password_hash,
          slug,
          status,
          subscription_type,
          subscription_price,
          mp_access_token,
          mp_user_id
        )
        VALUES (
          ${email},
          'test-password-hash',
          ${slug},
          'active',
          'monthly',
          50,
          '',
          ''
        )
        RETURNING id, email, slug, status
      `;
    } else if (client[0].status !== 'active') {
      // Activar cliente existente
      await sql`
        UPDATE clients
        SET status = 'active'
        WHERE id = ${client[0].id}
      `;
      client[0].status = 'active';
    }

    const clientData = client[0];

    // Crear sesión
    const sessionData = {
      id: clientData.id,
      email: clientData.email,
      slug: clientData.slug,
    };

    // Crear cookie de sesión
    const cookie = serialize('client_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/',
    });

    res.setHeader('Set-Cookie', cookie);

    return res.status(200).json({
      success: true,
      message: 'Sesión de prueba creada',
      client: {
        id: clientData.id,
        email: clientData.email,
        slug: clientData.slug,
      },
      redirect: '/onboarding',
    });

  } catch (error: any) {
    console.error('Error creando sesión de prueba:', error);
    return res.status(500).json({ error: error.message || 'Error al crear sesión' });
  }
}
