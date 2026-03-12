import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { hashPassword } from '@/lib/auth/client-auth';

async function validateAdmin(req: NextApiRequest): Promise<boolean> {
  const sessionCookie = req.cookies.admin_session;
  if (!sessionCookie) return false;
  try {
    const session = JSON.parse(sessionCookie);
    if (!session.id || !session.email) return false;
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`SELECT id FROM admins WHERE id = ${session.id} AND activo = true LIMIT 1`;
    return result.length > 0;
  } catch {
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const isAdmin = await validateAdmin(req);
  if (!isAdmin) return res.status(401).json({ error: 'No autorizado' });

  const sql = neon(process.env.DATABASE_URL!);

  // GET: listar clientes
  if (req.method === 'GET') {
    try {
      const clients = await sql`
        SELECT
          id, slug, email, nombre_completo, especialidad,
          status, created_at, mp_user_id, google_email
        FROM clients
        ORDER BY created_at DESC
      `;
      return res.status(200).json({ clients });
    } catch (error) {
      console.error('Error al listar clientes:', error);
      return res.status(500).json({ error: 'Error al cargar clientes' });
    }
  }

  // POST: crear cliente
  if (req.method === 'POST') {
    const { email, password, slug } = req.body;

    if (!email || !password || !slug) {
      return res.status(400).json({ error: 'Email, contraseña y slug son requeridos' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length < 3 || slug.length > 50) {
      return res.status(400).json({ error: 'Slug inválido. Solo letras minúsculas, números y guiones.' });
    }

    try {
      const existingEmail = await sql`SELECT id FROM clients WHERE email = ${email} LIMIT 1`;
      if (existingEmail.length > 0) {
        return res.status(409).json({ error: 'El email ya está registrado' });
      }

      const existingSlug = await sql`SELECT id FROM clients WHERE slug = ${slug} LIMIT 1`;
      if (existingSlug.length > 0) {
        return res.status(409).json({ error: 'El slug ya está en uso' });
      }

      const password_hash = await hashPassword(password);

      await sql`
        INSERT INTO clients (email, password_hash, slug, status, mp_access_token, mp_user_id)
        VALUES (${email}, ${password_hash}, ${slug}, 'active', '', '')
      `;

      return res.status(201).json({ success: true, slug });
    } catch (error) {
      console.error('Error al crear cliente:', error);
      return res.status(500).json({ error: 'Error al crear cliente' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
