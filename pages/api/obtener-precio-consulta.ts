// API para obtener el precio de consulta de un médico por slug o cal_username
import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug, calUsername } = req.query;

  if (!slug && !calUsername) {
    return res.status(400).json({ error: 'Slug o calUsername requerido' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);

    let result;

    if (slug && typeof slug === 'string') {
      result = await sql`
        SELECT slug, monto_consulta, nombre_completo
        FROM clients
        WHERE slug = ${slug}
        LIMIT 1
      `;
    } else if (calUsername && typeof calUsername === 'string') {
      result = await sql`
        SELECT slug, monto_consulta, nombre_completo
        FROM clients
        WHERE cal_username = ${calUsername}
        LIMIT 1
      `;
    }

    if (!result || result.length === 0) {
      return res.status(404).json({ error: 'Médico no encontrado' });
    }

    return res.status(200).json({
      slug: result[0].slug,
      monto_consulta: result[0].monto_consulta,
      nombre_completo: result[0].nombre_completo,
    });
  } catch (error) {
    console.error('Error al obtener precio de consulta:', error);
    return res.status(500).json({ error: 'Error al obtener precio' });
  }
}
