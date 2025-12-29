// pages/api/generate-auth-link.ts
// ⚠️ ENDPOINT ADMINISTRATIVO - Solo para uso interno/scripts
// NO usar desde el frontend público
// Para usuarios normales, usar: /api/connect-mercadopago

import type { NextApiRequest, NextApiResponse } from 'next';
import { generateMercadoPagoAuthLink } from '@/lib/mercadopago-auth';

interface GenerateAuthLinkRequest {
  userId: string;
  clientName: string;
  adminKey: string; // OBLIGATORIO
}

interface GenerateAuthLinkResponse {
  authUrl: string;
  sessionId: string;
  expiresAt: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateAuthLinkResponse | { error: string }>
) {
  // Solo aceptar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 🔐 OBLIGATORIO: Validar clave de administrador
  const { adminKey } = req.body;

  if (!process.env.ADMIN_SECRET_KEY) {
    console.error('[SECURITY] ADMIN_SECRET_KEY not configured');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
    console.warn('[SECURITY] Unauthorized attempt to generate auth link');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { userId, clientName }: GenerateAuthLinkRequest = req.body;

  // Validaciones
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId is required and must be a string' });
  }

  if (!clientName || typeof clientName !== 'string') {
    return res.status(400).json({ error: 'clientName is required and must be a string' });
  }

  // Validar longitud
  if (userId.length > 255 || clientName.length > 255) {
    return res.status(400).json({ error: 'userId and clientName must be less than 255 characters' });
  }

  try {
    // Usar la librería interna
    const { authUrl, sessionId, expiresAt } = await generateMercadoPagoAuthLink({
      userId,
      clientName,
    });

    console.log(`[Admin] Link generado para usuario: ${userId}`);

    return res.status(200).json({
      authUrl,
      sessionId,
      expiresAt: expiresAt.toISOString(),
    });

  } catch (error) {
    console.error('Error generando link de autorización:', error);
    return res.status(500).json({
      error: 'Error al generar el link de autorización',
    });
  }
}
