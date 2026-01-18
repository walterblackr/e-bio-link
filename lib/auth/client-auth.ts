// lib/auth/client-auth.ts
// Sistema de autenticación para clientes

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export interface Client {
  id: string;
  email: string;
  slug: string;
  nombre_completo: string;
  status: string;
  subscription_type: string | null;
}

/**
 * Verifica las credenciales de un cliente
 */
export async function verifyClientCredentials(
  email: string,
  password: string
): Promise<Client | null> {
  const sql = neon(process.env.DATABASE_URL!);

  // Buscar cliente por email
  const result = await sql`
    SELECT id, email, password_hash, slug, nombre_completo, status, subscription_type
    FROM clients
    WHERE email = ${email}
    LIMIT 1
  `;

  if (result.length === 0) {
    return null;
  }

  const client = result[0];

  // Verificar contraseña
  if (!client.password_hash) {
    return null;
  }

  const passwordMatch = await bcrypt.compare(password, client.password_hash);

  if (!passwordMatch) {
    return null;
  }

  // Retornar cliente sin el hash
  return {
    id: client.id,
    email: client.email,
    slug: client.slug,
    nombre_completo: client.nombre_completo || '',
    status: client.status,
    subscription_type: client.subscription_type,
  };
}

/**
 * Crea un hash de contraseña
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Crea una sesión de cliente (guarda en cookie)
 */
export async function createClientSession(client: Client): Promise<void> {
  const cookieStore = await cookies();

  // Guardar datos del cliente en cookie
  const sessionData = JSON.stringify({
    id: client.id,
    email: client.email,
    slug: client.slug,
    nombre_completo: client.nombre_completo,
    status: client.status,
  });

  cookieStore.set('client_session', sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 días
    path: '/',
  });
}

/**
 * Obtiene la sesión actual del cliente
 */
export async function getClientSession(): Promise<Client | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('client_session');

  if (!sessionCookie) {
    return null;
  }

  try {
    const session = JSON.parse(sessionCookie.value);

    // Verificar que el cliente sigue existiendo en la BD
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`
      SELECT id, email, slug, nombre_completo, status, subscription_type
      FROM clients
      WHERE id = ${session.id}
      LIMIT 1
    `;

    if (result.length === 0) {
      // Cliente no existe, eliminar sesión
      await destroyClientSession();
      return null;
    }

    return result[0] as Client;
  } catch (error) {
    console.error('Error al parsear sesión de cliente:', error);
    return null;
  }
}

/**
 * Destruye la sesión del cliente
 */
export async function destroyClientSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('client_session');
}

/**
 * Verifica si hay un cliente logueado
 */
export async function requireClient(): Promise<Client> {
  const client = await getClientSession();

  if (!client) {
    throw new Error('No autorizado');
  }

  return client;
}

/**
 * Verifica si hay un cliente logueado con status 'active'
 */
export async function requireActiveClient(): Promise<Client> {
  const client = await requireClient();

  if (client.status !== 'active') {
    throw new Error('Cuenta no activa - pago pendiente');
  }

  return client;
}
