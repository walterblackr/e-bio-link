// API endpoint para obtener datos del cliente por slug
// Usado por OG image route handler (Edge Runtime compatible)
import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Slug required' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);

    const result = await sql`
      SELECT
        slug,
        nombre_completo,
        especialidad,
        foto_url,
        descripcion,
        matricula
      FROM clients
      WHERE slug = ${slug}
      LIMIT 1
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    return res.status(200).json(result[0]);
  } catch (error) {
    console.error('Error fetching client by slug:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
