// pages/api/check-payment-status.ts
// Endpoint para que el frontend verifique el estado del pago (polling)

import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { serialize } from 'cookie';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { client_id } = req.query;

    if (!client_id || typeof client_id !== 'string') {
      return res.status(400).json({ error: 'client_id is required' });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Buscar el cliente
    const result = await sql`
      SELECT
        id,
        email,
        slug,
        status,
        subscription_type,
        subscription_price,
        paid_at,
        onboarding_mp_payment_id
      FROM clients
      WHERE id = ${client_id}
      LIMIT 1
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const client = result[0];

    // Si el cliente está activo, crear sesión automáticamente
    if (client.status === 'active') {
      const sessionData = {
        id: client.id,
        email: client.email,
        slug: client.slug,
      };

      const cookie = serialize('client_session', JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: '/',
      });

      res.setHeader('Set-Cookie', cookie);
    }

    return res.status(200).json({
      status: client.status,
      slug: client.slug,
      email: client.email,
      subscription_type: client.subscription_type,
      paid_at: client.paid_at,
      payment_id: client.onboarding_mp_payment_id,
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    return res.status(500).json({ error: 'Error al verificar el estado del pago' });
  }
}
