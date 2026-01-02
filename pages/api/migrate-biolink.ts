// API endpoint para ejecutar la migración de biolinks
// Solo para uso administrativo - agregar autenticación en producción

import type { NextApiRequest, NextApiResponse } from 'next';
import { migrateBiolinkColumns } from '@/lib/db/migrate-biolink';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // SEGURIDAD: Verificar clave de administrador
  const { adminKey } = req.body;

  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await migrateBiolinkColumns();

    return res.status(200).json({
      success: true,
      message: 'Migración ejecutada exitosamente',
    });
  } catch (error: any) {
    console.error('Error en migración:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error desconocido',
    });
  }
}
