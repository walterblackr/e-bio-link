// Script para ejecutar la migración de biolinks
// Ejecutar solo UNA VEZ para agregar las columnas necesarias

import { neon } from '@neondatabase/serverless';

export async function migrateBiolinkColumns() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL no está configurada');
  }

  const sql = neon(process.env.DATABASE_URL);



  try {
    // Agregar columnas a la tabla clients
    await sql`
      ALTER TABLE clients
      ADD COLUMN IF NOT EXISTS slug varchar(100) UNIQUE,
      ADD COLUMN IF NOT EXISTS nombre_completo varchar(255),
      ADD COLUMN IF NOT EXISTS foto_url text,
      ADD COLUMN IF NOT EXISTS especialidad varchar(255),
      ADD COLUMN IF NOT EXISTS matricula varchar(100),
      ADD COLUMN IF NOT EXISTS mensaje text,
      ADD COLUMN IF NOT EXISTS cal_username varchar(255),
      ADD COLUMN IF NOT EXISTS botones_config jsonb DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS tema_config jsonb DEFAULT '{
        "background": "#f8fafc",
        "text": "#0e0d0dff",
        "buttonBorder": "#ffffff",
        "separator": "#6ba1f2"
      }'::jsonb,
      ADD COLUMN IF NOT EXISTS biolink_activo boolean DEFAULT true
    `;

    console.log('✅ Columnas agregadas exitosamente');

    // Crear índices
    await sql`CREATE INDEX IF NOT EXISTS idx_clients_slug ON clients(slug)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_clients_biolink_activo ON clients(biolink_activo)`;

    console.log('✅ Índices creados exitosamente');

    console.log('🎉 Migración completada con éxito!');

    return { success: true };
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  }
}

// Si se ejecuta directamente desde la terminal
if (require.main === module) {
  migrateBiolinkColumns()
    .then(() => {
      console.log('Migración finalizada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
}
