// pages/api/check-slug-availability.ts
// Verifica si un slug está disponible

import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { slug } = req.query;

    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ error: 'Slug is required' });
    }

    // Validar formato del slug (solo letras, números, guiones)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return res.status(200).json({
        available: false,
        message: 'El slug solo puede contener letras minúsculas, números y guiones',
      });
    }

    // Verificar longitud
    if (slug.length < 3 || slug.length > 50) {
      return res.status(200).json({
        available: false,
        message: 'El slug debe tener entre 3 y 50 caracteres',
      });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Buscar si el slug ya existe
    const result = await sql`
      SELECT id
      FROM clients
      WHERE slug = ${slug}
      LIMIT 1
    `;

    if (result.length > 0) {
      return res.status(200).json({
        available: false,
        message: 'Este slug ya está en uso',
      });
    }

    return res.status(200).json({
      available: true,
      message: 'Slug disponible',
    });
  } catch (error) {
    console.error('Error checking slug availability:', error);
    return res.status(500).json({ error: 'Error al verificar disponibilidad' });
  }
}
