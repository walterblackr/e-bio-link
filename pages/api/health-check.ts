// pages/api/health-check.ts
// Endpoint para verificar la salud de los tokens almacenados
// Ejecutar periódicamente (ej: cada 24hs con un cron job)

import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { neon } from '@neondatabase/serverless';

interface TokenHealthStatus {
  clientId: string;
  clientName?: string;
  status: 'valid' | 'invalid' | 'error';
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Proteger con clave secreta
  const { adminKey } = req.query;
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);

    // Obtener todos los clientes
    const clients = await sql`
      SELECT id, client_name, mp_access_token FROM clients
    `;

    const healthStatus: TokenHealthStatus[] = [];

    // Verificar cada token
    for (const client of clients) {
      try {
        // Hacer una petición simple para verificar que el token funciona
        await axios.get('https://api.mercadopago.com/v1/account/settings', {
          headers: {
            'Authorization': `Bearer ${client.mp_access_token}`,
          },
          timeout: 5000,
        });

        healthStatus.push({
          clientId: client.id,
          clientName: client.client_name,
          status: 'valid',
        });

      } catch (error) {
        const status: TokenHealthStatus = {
          clientId: client.id,
          clientName: client.client_name,
          status: 'invalid',
        };

        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            status.error = 'Token revocado o expirado';

            // Auto-limpiar tokens inválidos
            await sql`DELETE FROM clients WHERE id = ${client.id}`;
            console.log(`🗑️ Token inválido eliminado: ${client.client_name || client.id}`);
          } else {
            status.error = `HTTP ${error.response?.status}`;
            status.status = 'error';
          }
        }

        healthStatus.push(status);
      }
    }

    const validCount = healthStatus.filter(s => s.status === 'valid').length;
    const invalidCount = healthStatus.filter(s => s.status === 'invalid').length;
    const errorCount = healthStatus.filter(s => s.status === 'error').length;

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      summary: {
        total: clients.length,
        valid: validCount,
        invalid: invalidCount,
        errors: errorCount,
      },
      details: healthStatus,
    });

  } catch (error) {
    console.error('Error en health check:', error);
    return res.status(500).json({
      error: 'Error verificando salud de tokens',
    });
  }
}
