// Archivo: pages/api/callback.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { neon } from '@neondatabase/serverless';

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

  // Validar state (opcional pero debe ser string si existe)
  const safeState = state && typeof state === 'string' ? state : '';

  try {
    console.log('Procesando autorización OAuth...');

    // 4. Canjear el código por el token de acceso
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
        timeout: 10000, // 10 segundos de timeout
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

    // 5. Generar slug del cliente de forma segura
    // Solo permitir caracteres alfanuméricos, guiones y guiones bajos
    let clientSlug = safeState || `cliente_${user_id}`;
    clientSlug = clientSlug
      .replace(/[^a-zA-Z0-9_-]/g, '_') // Reemplazar caracteres no válidos
      .substring(0, 255); // Limitar longitud

    // 6. Conexión a la base de datos Neon
    const sql = neon(process.env.DATABASE_URL!);

    // 7. Crear tabla si no existe
    await sql`
      CREATE TABLE IF NOT EXISTS clients (
        slug varchar(255) PRIMARY KEY,
        mp_access_token text NOT NULL,
        mp_user_id varchar(255) NOT NULL,
        mp_refresh_token text,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW()
      );
    `;

    // 8. Guardar o actualizar los datos del cliente
    await sql`
      INSERT INTO clients (slug, mp_access_token, mp_user_id, mp_refresh_token, updated_at)
      VALUES (${clientSlug}, ${access_token}, ${user_id}, ${refresh_token}, NOW())
      ON CONFLICT (slug)
      DO UPDATE SET
        mp_access_token = ${access_token},
        mp_refresh_token = ${refresh_token},
        updated_at = NOW();
    `;

    console.log(`Cliente ${clientSlug} conectado exitosamente`);

    // 9. Respuesta de éxito (HTML sanitizado)
    const safeClientSlug = escapeHtml(clientSlug);

    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Conexión Exitosa</title>
      </head>
      <body>
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #009EE3;">¡Conexión Exitosa! ✅</h1>
          <p>La cuenta de <strong>${safeClientSlug}</strong> se conectó correctamente.</p>
          <p>Ya podés cerrar esta ventana.</p>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    // 10. Manejo de errores seguro (sin exponer información sensible)
    console.error('Error en callback de Mercado Pago:', error);

    // Determinar el tipo de error de forma segura
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
