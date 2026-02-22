// pages/api/google/auth-url.ts
// Genera la URL de consentimiento OAuth2 de Google Calendar

import type { NextApiRequest, NextApiResponse } from 'next';
import { requireActiveClientFromRequest } from '../../../lib/auth/client-auth';
import { encrypt } from '../../../lib/encryption';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = await requireActiveClientFromRequest(req);

    if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
      return res.status(500).json({
        error: 'Google OAuth no está configurado en el servidor',
      });
    }

    // Encriptar el client_id como state para seguridad
    const state = encrypt(client.id);

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: SCOPES,
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return res.status(200).json({ url: authUrl });
  } catch (error: any) {
    console.error('Error en /api/google/auth-url:', error);

    if (error.message === 'No autorizado' || error.message === 'Cuenta no activa - pago pendiente') {
      return res.status(401).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Error al generar URL de autenticación' });
  }
}
