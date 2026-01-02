-- Migración para agregar columnas necesarias para biolinks dinámicos
-- Ejecutar este script una vez en la base de datos Neon

-- Agregar columnas a la tabla clients
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
ADD COLUMN IF NOT EXISTS biolink_activo boolean DEFAULT true;

-- Crear índice en slug para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_clients_slug ON clients(slug);

-- Crear índice en biolink_activo
CREATE INDEX IF NOT EXISTS idx_clients_biolink_activo ON clients(biolink_activo);

-- Comentarios para documentación
COMMENT ON COLUMN clients.slug IS 'URL amigable única para el biolink (ej: dr-juan-perez)';
COMMENT ON COLUMN clients.nombre_completo IS 'Nombre completo del profesional';
COMMENT ON COLUMN clients.foto_url IS 'URL de la foto de perfil';
COMMENT ON COLUMN clients.especialidad IS 'Especialidad médica';
COMMENT ON COLUMN clients.matricula IS 'Número de matrícula profesional';
COMMENT ON COLUMN clients.mensaje IS 'Mensaje personalizado para el biolink';
COMMENT ON COLUMN clients.cal_username IS 'Username de Cal.com (ej: dr-juan/30min)';
COMMENT ON COLUMN clients.botones_config IS 'Configuración de botones en formato JSON';
COMMENT ON COLUMN clients.tema_config IS 'Configuración de colores y tema en formato JSON';
COMMENT ON COLUMN clients.biolink_activo IS 'Indica si el biolink está activo y visible';
