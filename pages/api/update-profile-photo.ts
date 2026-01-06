// API endpoint para actualizar foto_url en la base de datos
import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { slug, photoUrl } = req.body;

    if (!slug || !photoUrl) {
      return res.status(400).json({ error: 'Slug and photoUrl are required' });
    }

    // Validar que sea una URL de Cloudinary
    if (!photoUrl.includes('cloudinary.com')) {
      return res.status(400).json({
        error: 'Invalid photo URL. Must be a Cloudinary URL.'
      });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Actualizar foto_url
    const result = await sql`
      UPDATE clients
      SET foto_url = ${photoUrl}
      WHERE slug = ${slug}
      RETURNING slug, foto_url
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Photo updated successfully',
      profile: result[0]
    });
  } catch (error: any) {
    console.error('Error updating photo:', error);
    return res.status(500).json({
      error: 'Failed to update photo',
      details: error.message
    });
  }
}
