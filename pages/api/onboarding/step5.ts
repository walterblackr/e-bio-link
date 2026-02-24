// API para configurar el método de pago en el onboarding (Step 5)
import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { requireActiveClientFromRequest } from '../../../lib/auth/client-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const client = await requireActiveClientFromRequest(req);
    const sql = neon(process.env.DATABASE_URL!);

    if (req.method === 'GET') {
      // Obtener configuración actual de pago
      const result = await sql`
        SELECT
          payment_method,
          cbu_alias,
          banco_nombre,
          titular_cuenta,
          mp_user_id,
          mp_access_token
        FROM clients
        WHERE id = ${client.id}
        LIMIT 1
      `;

      const data = result[0];

      return res.status(200).json({
        payment_method: data.payment_method || 'mp',
        cbu_alias: data.cbu_alias || '',
        banco_nombre: data.banco_nombre || '',
        titular_cuenta: data.titular_cuenta || '',
        mp_connected: !!(data.mp_user_id && data.mp_access_token),
      });
    }

    if (req.method === 'POST') {
      const { payment_method, cbu_alias, banco_nombre, titular_cuenta } = req.body;

      if (!payment_method || !['mp', 'transfer'].includes(payment_method)) {
        return res.status(400).json({ error: 'payment_method debe ser "mp" o "transfer"' });
      }

      if (payment_method === 'transfer') {
        if (!cbu_alias || !titular_cuenta) {
          return res.status(400).json({
            error: 'CBU/Alias y titular son requeridos para transferencia',
          });
        }
      }

      await sql`
        UPDATE clients
        SET
          payment_method = ${payment_method},
          cbu_alias = ${cbu_alias || null},
          banco_nombre = ${banco_nombre || null},
          titular_cuenta = ${titular_cuenta || null},
          updated_at = NOW()
        WHERE id = ${client.id}
      `;

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    if (error.message === 'No autorizado' || error.message === 'Cuenta no activa - pago pendiente') {
      return res.status(401).json({ error: 'No autorizado' });
    }
    console.error('Error in step5:', error);
    return res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
}
