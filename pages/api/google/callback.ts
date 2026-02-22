// pages/api/google/callback.ts
// Maneja el callback de Google OAuth2
// Google redirige aquí después de que el usuario autoriza

import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import axios from 'axios';
import { encrypt, decrypt } from '../../../lib/encryption';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, state, error: oauthError } = req.query;

    // Si el usuario canceló la autorización
    if (oauthError) {
      console.error('[Google Callback] OAuth error:', oauthError);
      return res.redirect('/onboarding?google=error&reason=cancelled');
    }

    if (!code || !state) {
      return res.redirect('/onboarding?google=error&reason=missing_params');
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
      console.error('[Google Callback] Missing Google OAuth env vars');
      return res.redirect('/onboarding?google=error&reason=config');
    }

    // Desencriptar el state para obtener el client_id
    let clientId: string;
    try {
      clientId = decrypt(state as string);
    } catch {
      console.error('[Google Callback] Invalid state parameter');
      return res.redirect('/onboarding?google=error&reason=invalid_state');
    }

    // Intercambiar code por tokens
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', null, {
      params: {
        code: code as string,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      },
    });

    const {
      access_token,
      refresh_token,
      expires_in,
    } = tokenResponse.data;

    if (!refresh_token) {
      console.error('[Google Callback] No refresh_token received. User may need to revoke and re-authorize.');
      return res.redirect('/onboarding?google=error&reason=no_refresh_token');
    }

    // Obtener email del usuario de Google
    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const googleEmail = userInfoResponse.data.email;

    // Calcular fecha de expiración del token
    const tokenExpiry = new Date(Date.now() + expires_in * 1000).toISOString();

    // Guardar tokens encriptados en la BD
    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      UPDATE clients
      SET
        google_access_token = ${encrypt(access_token)},
        google_refresh_token = ${encrypt(refresh_token)},
        google_email = ${googleEmail},
        google_calendar_id = 'primary',
        google_token_expiry = ${tokenExpiry},
        updated_at = NOW()
      WHERE id = ${clientId}
    `;

    console.log(`[Google Callback] Client ${clientId} connected Google Calendar (${googleEmail})`);

    // Redirigir de vuelta al onboarding con éxito
    return res.redirect('/onboarding?google=connected');

  } catch (error: any) {
    console.error('[Google Callback] Error:', error.response?.data || error.message);

    if (axios.isAxiosError(error) && error.response?.data?.error === 'invalid_grant') {
      return res.redirect('/onboarding?google=error&reason=invalid_grant');
    }

    return res.redirect('/onboarding?google=error&reason=unknown');
  }
}
