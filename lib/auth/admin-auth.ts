// lib/auth/admin-auth.ts
// Sistema de autenticación para administradores

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export interface Admin {
  id: string;
  email: string;
  nombre: string;
  activo: boolean;
}

/**
 * Verifica las credenciales de un admin
 */
export async function verifyAdminCredentials(
  email: string,
  password: string
): Promise<Admin | null> {
  const sql = neon(process.env.DATABASE_URL!);

  // Buscar admin por email
  const result = await sql`
    SELECT id, email, password_hash, nombre, activo
    FROM admins
    WHERE email = ${email}
    LIMIT 1
  `;

  if (result.length === 0) {
    return null;
  }

  const admin = result[0];

  // Verificar que esté activo
  if (!admin.activo) {
    return null;
  }

  // Verificar contraseña
  const passwordMatch = await bcrypt.compare(password, admin.password_hash);

  if (!passwordMatch) {
    return null;
  }

  // Retornar admin sin el hash
  return {
    id: admin.id,
    email: admin.email,
    nombre: admin.nombre,
    activo: admin.activo,
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
 * Crea una sesión de admin (guarda en cookie)
 */
export async function createAdminSession(admin: Admin): Promise<void> {
  const cookieStore = await cookies();

  // Guardar datos del admin en cookie (firmada y encriptada en producción)
  const sessionData = JSON.stringify({
    id: admin.id,
    email: admin.email,
    nombre: admin.nombre,
  });

  cookieStore.set('admin_session', sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 días
    path: '/',
  });
}

/**
 * Obtiene la sesión actual del admin
 */
export async function getAdminSession(): Promise<Admin | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('admin_session');

  if (!sessionCookie) {
    return null;
  }

  try {
    const session = JSON.parse(sessionCookie.value);

    // Verificar que el admin sigue activo en la BD
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`
      SELECT id, email, nombre, activo
      FROM admins
      WHERE id = ${session.id} AND activo = true
      LIMIT 1
    `;

    if (result.length === 0) {
      // Admin desactivado, eliminar sesión
      await destroyAdminSession();
      return null;
    }

    return result[0] as Admin;
  } catch (error) {
    console.error('Error al parsear sesión:', error);
    return null;
  }
}

/**
 * Destruye la sesión del admin
 */
export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
}

/**
 * Verifica si hay un admin logueado
 */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdminSession();

  if (!admin) {
    throw new Error('No autorizado');
  }

  return admin;
}
