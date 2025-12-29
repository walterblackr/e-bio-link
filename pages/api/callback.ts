// Archivo: pages/api/callback.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'crypto';

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

    // 6. Generar UUID único para el cliente
    const clientId = randomUUID();

    // 7. Crear tabla de clientes si no existe
    await sql`
      CREATE TABLE IF NOT EXISTS clients (
        id uuid PRIMARY KEY,
        user_id varchar(255) NOT NULL,
        client_name varchar(255),
        mp_access_token text NOT NULL,
        mp_user_id varchar(255) NOT NULL UNIQUE,
        mp_refresh_token text,
        created_at timestamp DEFAULT NOW(),
        updated_at timestamp DEFAULT NOW()
      );
    `;

    // 8. Crear tabla de sesiones OAuth si no existe
    await sql`
      CREATE TABLE IF NOT EXISTS oauth_sessions (
        session_id uuid PRIMARY KEY,
        user_id varchar(255) NOT NULL,
        client_name varchar(255),
        status varchar(50) DEFAULT 'pending',
        created_at timestamp DEFAULT NOW(),
        completed_at timestamp
      );
    `;

    // 9. Guardar o actualizar los datos del cliente
    // Si el mp_user_id ya existe, actualizar el token
    const existingClient = await sql`
      SELECT id FROM clients WHERE mp_user_id = ${user_id}
    `;

    if (existingClient.length > 0) {
      // Actualizar cliente existente
      await sql`
        UPDATE clients
        SET mp_access_token = ${access_token},
            mp_refresh_token = ${refresh_token},
            updated_at = NOW()
        WHERE mp_user_id = ${user_id}
      `;
      console.log(`Cliente existente actualizado: ${user_id}`);
    } else {
      // Crear nuevo cliente
      await sql`
        INSERT INTO clients (id, user_id, client_name, mp_access_token, mp_user_id, mp_refresh_token)
        VALUES (${clientId}, ${session.user_id}, ${session.client_name}, ${access_token}, ${user_id}, ${refresh_token})
      `;
      console.log(`Nuevo cliente creado: ${clientId}`);
    }

    // 10. Marcar la sesión como completada
    await sql`
      UPDATE oauth_sessions
      SET status = 'completed', completed_at = NOW()
      WHERE session_id = ${sessionId}
    `;

    // 11. Respuesta de éxito
    const safeClientName = escapeHtml(session.client_name || 'Cliente');

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
          <p>La cuenta de <strong>${safeClientName}</strong> se conectó correctamente a Mercado Pago.</p>
          <p>Ya podés cerrar esta ventana.</p>
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
