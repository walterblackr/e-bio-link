// pages/api/onboarding/step1.ts
// Guardar datos del paso 1 del onboarding (identidad + colores)

import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { requireActiveClientFromRequest } from '../../../lib/auth/client-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar sesión del cliente
    const client = await requireActiveClientFromRequest(req);

    const {
      nombre_completo,
      especialidad,
      matricula,
      descripcion,
      foto_url,
      monto_consulta,
      tema_config,
      botones_config,
    } = req.body;

    // Validaciones básicas
    if (!nombre_completo || !especialidad || !matricula) {
      return res.status(400).json({ error: 'Campos requeridos faltantes' });
    }

    if (!monto_consulta || monto_consulta < 0) {
      return res.status(400).json({ error: 'Monto de consulta inválido' });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Actualizar datos del cliente
    await sql`
      UPDATE clients
      SET
        nombre_completo = ${nombre_completo},
        especialidad = ${especialidad},
        matricula = ${matricula},
        descripcion = ${descripcion || ''},
        foto_url = ${foto_url || ''},
        monto_consulta = ${monto_consulta},
        tema_config = ${JSON.stringify(tema_config)},
        botones_config = ${JSON.stringify(botones_config || [])},
        updated_at = NOW()
      WHERE id = ${client.id}
    `;

    return res.status(200).json({
      success: true,
      message: 'Datos guardados exitosamente',
    });
  } catch (error: any) {
    console.error('Error en onboarding step 1:', error);

    if (error.message === 'No active client session') {
      return res.status(401).json({ error: 'Sesión inválida' });
    }

    return res.status(500).json({ error: 'Error al guardar los datos' });
  }
}
