// API para actualizar y eliminar clientes específicos
import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';

// Validar sesión de admin
async function validateAdminSession(req: NextApiRequest): Promise<boolean> {
  const adminKey = req.cookies.admin_session;
  if (!adminKey) return false;

  try {
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`
      SELECT password_hash FROM admin_users WHERE username = 'admin' LIMIT 1
    `;

    if (result.length === 0) return false;

    return await bcrypt.compare(adminKey, result[0].password_hash);
  } catch {
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Validar autenticación
  const isAuthenticated = await validateAdminSession(req);
  if (!isAuthenticated) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Slug inválido' });
  }

  const sql = neon(process.env.DATABASE_URL!);

  // PUT: Actualizar cliente
  if (req.method === 'PUT') {
    try {
      const {
        nombre_completo,
        especialidad,
        matricula,
        descripcion,
        foto_url,
        cal_api_key,
        cal_username,
      } = req.body;

      // Validaciones
      if (!nombre_completo || !especialidad || !matricula) {
        return res.status(400).json({
          error: 'Faltan campos obligatorios: nombre_completo, especialidad, matricula',
        });
      }

      // Verificar que el cliente existe
      const existing = await sql`
        SELECT slug FROM clients WHERE slug = ${slug}
      `;

      if (existing.length === 0) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      // Actualizar cliente (NO actualizar mp_access_token, eso lo hace el OAuth)
      await sql`
        UPDATE clients
        SET
          nombre_completo = ${nombre_completo},
          especialidad = ${especialidad},
          matricula = ${matricula},
          descripcion = ${descripcion || ''},
          foto_url = ${foto_url || ''},
          cal_api_key = ${cal_api_key || ''},
          cal_username = ${cal_username || ''},
          updated_at = NOW()
        WHERE slug = ${slug}
      `;

      return res.status(200).json({
        message: 'Cliente actualizado exitosamente',
        slug,
      });
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      return res.status(500).json({ error: 'Error al actualizar cliente' });
    }
  }

  // DELETE: Eliminar cliente
  if (req.method === 'DELETE') {
    try {
      // Verificar que el cliente exists
      const existing = await sql`
        SELECT slug FROM clients WHERE slug = ${slug}
      `;

      if (existing.length === 0) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      // Eliminar cliente
      await sql`
        DELETE FROM clients WHERE slug = ${slug}
      `;

      return res.status(200).json({
        message: 'Cliente eliminado exitosamente',
      });
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      return res.status(500).json({ error: 'Error al eliminar cliente' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
