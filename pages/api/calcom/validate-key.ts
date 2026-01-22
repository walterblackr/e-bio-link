// API endpoint para validar API Key de Cal.com y guardarla
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { neon } from '@neondatabase/serverless';

// Función para validar sesión de cliente activo
async function requireActiveClient(req: NextApiRequest): Promise<any> {
  const sessionCookie = req.cookies.client_session;

  if (!sessionCookie) {
    throw new Error('No autorizado');
  }

  try {
    const session = JSON.parse(sessionCookie);

    if (!session.id || !session.email) {
      throw new Error('Sesión inválida');
    }

    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`
      SELECT * FROM clients WHERE id = ${session.id} AND status = 'active' LIMIT 1
    `;

    if (result.length === 0) {
      throw new Error('Cliente no encontrado o inactivo');
    }

    return result[0];
  } catch {
    throw new Error('Error de autenticación');
  }
}

// Tipos para la respuesta de Cal.com API
interface CalComMeResponse {
  user: {
    id: number;
    username: string;
    email: string;
    name: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validar autenticación
    const client = await requireActiveClient(req);

    // Obtener API key del body
    const { apiKey } = req.body;

    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({ error: 'API Key requerida' });
    }

    // Validar formato básico
    if (!apiKey.startsWith('cal_live_') && !apiKey.startsWith('cal_test_')) {
      return res.status(400).json({
        error: 'API Key inválida. Debe comenzar con cal_live_ o cal_test_',
      });
    }

    // Validar API key llamando a Cal.com API
    let calComUser: CalComMeResponse;

    try {
      const response = await axios.get<CalComMeResponse>(
        'https://api.cal.com/v2/me',
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'cal-api-version': '2024-08-13',
          },
          timeout: 10000,
        }
      );

      calComUser = response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          return res.status(401).json({
            error: 'API Key inválida o expirada. Verificá que sea correcta.',
          });
        }
      }
      throw new Error('Error al validar API Key con Cal.com');
    }

    // Guardar API key en la base de datos
    const sql = neon(process.env.DATABASE_URL!);

    await sql`
      UPDATE clients
      SET
        cal_api_key = ${apiKey},
        cal_username = ${calComUser.user.username},
        updated_at = NOW()
      WHERE id = ${client.id}
    `;

    return res.status(200).json({
      success: true,
      username: calComUser.user.username,
      message: 'API Key validada y guardada correctamente',
    });

  } catch (error: any) {
    console.error('Error en calcom/validate-key:', error);
    return res.status(500).json({
      error: error.message || 'Error al validar API Key',
    });
  }
}
