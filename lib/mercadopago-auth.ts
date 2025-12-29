// lib/mercadopago-auth.ts
// Librería INTERNA para generar links de autorización
// NUNCA exponer esto al frontend público

import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'crypto';

interface GenerateAuthLinkOptions {
  userId: string;
  clientName: string;
}

interface AuthLinkResult {
  authUrl: string;
  sessionId: string;
  expiresAt: Date;
}

/**
 * Genera un link de autorización seguro para Mercado Pago
 * 🔒 SOLO usar desde el SERVIDOR, NUNCA desde el cliente
 */
export async function generateMercadoPagoAuthLink(
  options: GenerateAuthLinkOptions
): Promise<AuthLinkResult> {
  const { userId, clientName } = options;

  // Validaciones
  if (!userId || !clientName) {
    throw new Error('userId and clientName are required');
  }

  if (userId.length > 255 || clientName.length > 255) {
    throw new Error('userId and clientName must be less than 255 characters');
  }

  const sql = neon(process.env.DATABASE_URL!);

  // Crear tabla de sesiones si no existe
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

  // Generar UUID para la sesión
  const sessionId = randomUUID();

  // Guardar la sesión en la BD
  await sql`
    INSERT INTO oauth_sessions (session_id, user_id, client_name, status)
    VALUES (${sessionId}, ${userId}, ${clientName}, 'pending')
  `;

  // Construir la URL de autorización
  const authUrl = new URL('https://auth.mercadopago.com/authorization');
  authUrl.searchParams.set('client_id', process.env.MP_CLIENT_ID!);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('platform_id', 'mp');
  authUrl.searchParams.set('state', sessionId);
  authUrl.searchParams.set('redirect_uri', process.env.MP_REDIRECT_URI!);

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  console.log(`[OAuth] Sesión creada: ${sessionId} para usuario: ${userId}`);

  return {
    authUrl: authUrl.toString(),
    sessionId,
    expiresAt,
  };
}

/**
 * Verifica si un usuario ya tiene una cuenta de Mercado Pago conectada
 */
export async function hasActiveMercadoPagoConnection(
  userId: string
): Promise<boolean> {
  const sql = neon(process.env.DATABASE_URL!);

  const result = await sql`
    SELECT COUNT(*) as count
    FROM clients
    WHERE user_id = ${userId}
  `;

  return result[0].count > 0;
}

/**
 * Obtiene el token de Mercado Pago de un usuario
 */
export async function getMercadoPagoToken(
  userId: string
): Promise<string | null> {
  const sql = neon(process.env.DATABASE_URL!);

  const result = await sql`
    SELECT mp_access_token
    FROM clients
    WHERE user_id = ${userId}
    LIMIT 1
  `;

  return result[0]?.mp_access_token || null;
}
