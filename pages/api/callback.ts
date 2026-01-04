// Archivo: pages/api/callback.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { neon } from '@neondatabase/serverless';
import { encrypt } from '../../lib/encryption';

// Función para sanitizar HTML y prevenir XSS
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Validación de variables de entorno
function validateEnvVars(): void {
  const required = ['MP_CLIENT_SECRET', 'MP_CLIENT_ID', 'MP_REDIRECT_URI', 'DATABASE_URL'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Tipos para la respuesta de Mercado Pago
interface MercadoPagoTokenResponse {
  access_token: string;
  user_id: string;
  refresh_token: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1. VALIDACIÓN: Solo aceptar método GET (el callback de OAuth usa GET)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Validar variables de entorno
  try {
    validateEnvVars();
  } catch (error) {
    console.error('Configuration error:', error);
    return res.status(500).send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #e74c3c;">Error de Configuración ❌</h1>
        <p>El servidor no está configurado correctamente. Contactá al administrador.</p>
      </div>
    `);
  }

  // 3. Recibir y validar el código de autorización
  const { code, state } = req.query;

  // Validar que code sea string y exista
  if (!code || typeof code !== 'string') {
    return res.status(400).send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #e74c3c;">Error de Autorización ❌</h1>
        <p>No se recibió el código de autorización de Mercado Pago.</p>
      </div>
    `);
  }

  // 🔐 SEGURIDAD: Validar que el state es un UUID válido generado por nosotros
  const sessionId = state && typeof state === 'string' ? state : null;

  if (!sessionId || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) {
    return res.status(400).send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #e74c3c;">Sesión Inválida ❌</h1>
        <p>La sesión de autorización no es válida o ha expirado.</p>
        <p style="color: #7f8c8d; font-size: 14px;">
          Por favor, iniciá el proceso de conexión nuevamente desde tu panel.
        </p>
      </div>
    `);
  }

  try {
    console.log('Procesando autorización OAuth...');

    const sql = neon(process.env.DATABASE_URL!);

    // 4. Verificar que la sesión existe y está pendiente
    const sessionCheck = await sql`
      SELECT user_id, client_name, status, created_at
      FROM oauth_sessions
      WHERE session_id = ${sessionId}
    `;

    if (sessionCheck.length === 0) {
      return res.status(404).send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #e74c3c;">Sesión No Encontrada ❌</h1>
          <p>Esta sesión no existe o ya fue utilizada.</p>
        </div>
      `);
    }

    const session = sessionCheck[0];

    // Verificar que la sesión no haya expirado (24 horas)
    const sessionAge = Date.now() - new Date(session.created_at).getTime();
    const MAX_SESSION_AGE = 24 * 60 * 60 * 1000; // 24 horas

    if (sessionAge > MAX_SESSION_AGE) {
      return res.status(410).send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #e74c3c;">Sesión Expirada ❌</h1>
          <p>Esta sesión ha expirado. Por favor, iniciá el proceso nuevamente.</p>
        </div>
      `);
    }

    // Verificar que la sesión esté en estado "pending"
    if (session.status !== 'pending') {
      return res.status(409).send(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #e74c3c;">Sesión Ya Utilizada ❌</h1>
          <p>Esta sesión ya fue procesada anteriormente.</p>
        </div>
      `);
    }

    // 5. Canjear el código por el token de acceso
    const response = await axios.post<MercadoPagoTokenResponse>(
      'https://api.mercadopago.com/oauth/token',
      {
        client_secret: process.env.MP_CLIENT_SECRET,
        client_id: process.env.MP_CLIENT_ID,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.MP_REDIRECT_URI,
      },
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const { access_token, user_id, refresh_token } = response.data;

    // Validar que recibimos los datos necesarios
    if (!access_token || !user_id) {
      throw new Error('Invalid response from Mercado Pago API');
    }

    // 6. Generar slug único basado en client_name
    // Convertir nombre a slug: "Dr. Juan Pérez" -> "dr-juan-perez"
    const generateSlug = (name: string): string => {
      return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
        .trim()
        .replace(/\s+/g, '-') // Espacios a guiones
        .replace(/-+/g, '-'); // Múltiples guiones a uno solo
    };

    const baseSlug = generateSlug(session.client_name || 'medico');
    let slug = baseSlug;
    let counter = 1;

    // Verificar si el slug ya existe y generar uno único
    while (true) {
      const existingSlug = await sql`
        SELECT slug FROM clients WHERE slug = ${slug}
      `;
      if (existingSlug.length === 0) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // 7. Guardar o actualizar los datos del cliente
    // Si el mp_user_id ya existe, actualizar el token
    const existingClient = await sql`
      SELECT slug FROM clients WHERE mp_user_id = ${user_id}
    `;

    // Encriptar tokens antes de guardarlos
    const encryptedAccessToken = encrypt(access_token);
    const encryptedRefreshToken = refresh_token ? encrypt(refresh_token) : '';

    if (existingClient.length > 0) {
      // Actualizar cliente existente
      await sql`
        UPDATE clients
        SET mp_access_token = ${encryptedAccessToken},
            mp_refresh_token = ${encryptedRefreshToken}
        WHERE mp_user_id = ${user_id}
      `;
      console.log(`Cliente existente actualizado: ${user_id}`);
      slug = existingClient[0].slug; // Usar el slug existente
    } else {
      // Crear nuevo cliente con valores por defecto
      await sql`
        INSERT INTO clients (
          slug,
          mp_access_token,
          mp_user_id,
          mp_refresh_token,
          nombre_completo,
          foto_url,
          cal_api_key,
          cal_username,
          botones_config,
          tema_config,
          especialidad,
          matricula,
          descripcion
        )
        VALUES (
          ${slug},
          ${encryptedAccessToken},
          ${user_id},
          ${encryptedRefreshToken},
          ${session.client_name || 'Médico'},
          '',
          '',
          '',
          '[]'::jsonb,
          '{}'::jsonb,
          '',
          '',
          ''
        )
      `;
      console.log(`Nuevo cliente creado con slug: ${slug}`);
    }

    // 10. Marcar la sesión como completada
    await sql`
      UPDATE oauth_sessions
      SET status = 'completed', completed_at = NOW()
      WHERE session_id = ${sessionId}
    `;

    // 11. Respuesta de éxito
    const safeClientName = escapeHtml(session.client_name || 'Cliente');
    const safeSlug = escapeHtml(slug);
    const biolinkUrl = `https://e-bio-link.vercel.app/biolink/${safeSlug}`;

    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Conexión Exitosa</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            max-width: 500px;
            text-align: center;
          }
          h1 { color: #009EE3; margin-bottom: 20px; }
          .biolink {
            background: #f8fafc;
            padding: 16px;
            border-radius: 8px;
            margin: 20px 0;
            word-break: break-all;
          }
          .biolink a {
            color: #2563eb;
            text-decoration: none;
            font-weight: 600;
          }
          .biolink a:hover {
            text-decoration: underline;
          }
          .note {
            color: #64748b;
            font-size: 14px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>¡Conexión Exitosa! ✅</h1>
          <p>La cuenta de <strong>${safeClientName}</strong> se conectó correctamente a Mercado Pago.</p>

          <div class="biolink">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;">Tu biolink:</p>
            <a href="${biolinkUrl}" target="_blank">${biolinkUrl}</a>
          </div>

          <p class="note">Ya podés cerrar esta ventana y configurar tu perfil.</p>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    // 12. Manejo de errores seguro
    console.error('Error en callback de Mercado Pago:', error);

    let userMessage = 'Ocurrió un error al procesar la autorización.';

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        userMessage = 'Error de autenticación con Mercado Pago. Verificá las credenciales.';
      } else if (error.code === 'ECONNABORTED') {
        userMessage = 'La conexión con Mercado Pago tardó demasiado. Intentá de nuevo.';
      }
    }

    return res.status(500).send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error</title>
      </head>
      <body>
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #e74c3c;">Ups, hubo un error ❌</h1>
          <p>${escapeHtml(userMessage)}</p>
          <p style="color: #7f8c8d; font-size: 14px;">
            Si el problema persiste, contactá al administrador del sistema.
          </p>
        </div>
      </body>
      </html>
    `);
  }
}
