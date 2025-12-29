// Archivo: pages/api/revoke-access.ts
// Endpoint para revocar el acceso de un cliente en caso de emergencia

import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { neon } from '@neondatabase/serverless';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Solo aceptar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { clientId, adminKey } = req.body;

  // 🔐 IMPORTANTE: Proteger este endpoint con una clave secreta
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!clientId) {
    return res.status(400).json({ error: 'clientId is required' });
  }

  // Validar que sea un UUID válido
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clientId)) {
    return res.status(400).json({ error: 'clientId must be a valid UUID' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);

    // 1. Obtener el token del cliente
    const result = await sql`
      SELECT mp_access_token FROM clients WHERE id = ${clientId}
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const { mp_access_token } = result[0];

    // 2. Revocar el token en Mercado Pago
    try {
      await axios.post(
        `https://api.mercadopago.com/oauth/token/${mp_access_token}`,
        null,
        {
          headers: {
            'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`, // Tu token de aplicación
          },
          params: {
            client_id: process.env.MP_CLIENT_ID,
            client_secret: process.env.MP_CLIENT_SECRET,
          },
        }
      );
    } catch (mpError) {
      console.error('Error revocando en Mercado Pago:', mpError);
      // Continuar para eliminar de BD aunque falle la revocación
    }

    // 3. Eliminar el token de la base de datos
    await sql`
      DELETE FROM clients WHERE id = ${clientId}
    `;

    console.log(`✅ Acceso revocado para cliente: ${clientId}`);

    return res.status(200).json({
      success: true,
      message: `Acceso revocado para cliente ID: ${clientId}`,
    });

  } catch (error) {
    console.error('Error revocando acceso:', error);
    return res.status(500).json({
      error: 'Error al revocar acceso',
    });
  }
}
