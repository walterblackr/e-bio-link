// Función para obtener perfil de cliente por slug
import { neon } from '@neondatabase/serverless';

export interface ProfileData {
  slug: string;
  nombre_completo: string;
  especialidad: string;
  foto_url: string;
  descripcion: string;
  matricula: string;
}

export async function getProfileBySlug(slug: string): Promise<ProfileData | null> {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    const result = await sql`
      SELECT
        slug,
        nombre_completo,
        especialidad,
        foto_url,
        descripcion,
        matricula
      FROM clients
      WHERE slug = ${slug}
      LIMIT 1
    `;

    if (result.length === 0) {
      return null;
    }

    return result[0] as ProfileData;
  } catch (error) {
    console.error('Error getting profile by slug:', error);
    return null;
  }
}
