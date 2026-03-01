// pages/api/mp/auth-url.ts
// Genera la URL de autorización OAuth de Mercado Pago para el médico

import type { NextApiRequest, NextApiResponse } from 'next';
import { requireActiveClientFromRequest } from '../../../lib/auth/client-auth';
import { generateMercadoPagoAuthLink } from '../../../lib/mercadopago-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = await requireActiveClientFromRequest(req);
    const { authUrl } = await generateMercadoPagoAuthLink({ userId: client.id });
    return res.status(200).json({ url: authUrl });
  } catch (error: any) {
    console.error('Error en /api/mp/auth-url:', error);

    if (
      error.message === 'No autorizado' ||
      error.message === 'Cuenta no activa - pago pendiente'
    ) {
      return res.status(401).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Error al generar URL de autenticación' });
  }
}
