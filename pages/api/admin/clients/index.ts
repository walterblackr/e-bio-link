// API para listar y crear clientes
import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';

// Validar sesión de admin
async function validateAdminSession(req: NextApiRequest): Promise<boolean> {
  const sessionCookie = req.cookies.admin_session;
  if (!sessionCookie) return false;

  try {
    // Parsear el JSON de la sesión
    const session = JSON.parse(sessionCookie);

    // Verificar que tenga los campos necesarios
    if (!session.id || !session.email) {
      return false;
    }

    // Verificar que el admin exista y esté activo
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`
      SELECT id FROM admins WHERE id = ${session.id} AND activo = true LIMIT 1
    `;

    return result.length > 0;
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

  const sql = neon(process.env.DATABASE_URL!);

  // GET: Listar todos los clientes
  if (req.method === 'GET') {
    try {
      const clients = await sql`
        SELECT
          id,
          slug,
          nombre_completo,
          especialidad,
          matricula,
          descripcion,
          foto_url,
          cal_api_key,
          cal_username,
          mp_user_id,
          created_at,
          botones_config,
          tema_config,
          monto_consulta
        FROM clients
        ORDER BY created_at DESC
      `;

      return res.status(200).json({ clients });
    } catch (error) {
      console.error('Error al listar clientes:', error);
      return res.status(500).json({ error: 'Error al cargar clientes' });
    }
  }

  // POST: Crear nuevo cliente
  if (req.method === 'POST') {
    try {
      const {
        slug,
        nombre_completo,
        especialidad,
        matricula,
        descripcion,
        foto_url,
        cal_api_key,
        cal_username,
        botones_config,
        tema_config,
        monto_consulta,
      } = req.body;

      // Validaciones
      if (!slug || !nombre_completo || !especialidad || !matricula) {
        return res.status(400).json({
          error: 'Faltan campos obligatorios: slug, nombre_completo, especialidad, matricula',
        });
      }

      // Validar formato de slug
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        return res.status(400).json({
          error: 'El slug solo puede contener letras minúsculas, números y guiones',
        });
      }

      // Validar y parsear JSON de botones_config
      let botonesConfigParsed;
      try {
        botonesConfigParsed = botones_config ? JSON.parse(botones_config) : [];
      } catch {
        return res.status(400).json({
          error: 'El campo botones_config debe ser un JSON válido',
        });
      }

      // Validar y parsear JSON de tema_config
      let temaConfigParsed;
      try {
        temaConfigParsed = tema_config ? JSON.parse(tema_config) : {};
      } catch {
        return res.status(400).json({
          error: 'El campo tema_config debe ser un JSON válido',
        });
      }

      // Verificar que el slug no exista
      const existingSlug = await sql`
        SELECT slug FROM clients WHERE slug = ${slug}
      `;

      if (existingSlug.length > 0) {
        return res.status(409).json({
          error: 'Este slug ya existe. Elegí otro.',
        });
      }

      // Crear cliente
      await sql`
        INSERT INTO clients (
          slug,
          nombre_completo,
          especialidad,
          matricula,
          descripcion,
          foto_url,
          cal_api_key,
          cal_username,
          mp_access_token,
          mp_user_id,
          mp_refresh_token,
          botones_config,
          tema_config,
          monto_consulta
        )
        VALUES (
          ${slug},
          ${nombre_completo},
          ${especialidad},
          ${matricula},
          ${descripcion || ''},
          ${foto_url || ''},
          ${cal_api_key || ''},
          ${cal_username || ''},
          '',
          '',
          '',
          ${JSON.stringify(botonesConfigParsed)}::jsonb,
          ${JSON.stringify(temaConfigParsed)}::jsonb,
          ${parseFloat(monto_consulta) || 10000}
        )
      `;

      return res.status(201).json({
        message: 'Cliente creado exitosamente',
        slug,
      });
    } catch (error) {
      console.error('Error al crear cliente:', error);
      return res.status(500).json({ error: 'Error al crear cliente' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
