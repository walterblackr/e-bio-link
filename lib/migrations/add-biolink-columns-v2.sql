-- Migración actualizada para biolinks dinámicos
-- Compatible con estructura actual de la tabla clients

-- Verificar columnas existentes antes de agregar
-- Solo agrega las que faltan según el esquema actual

-- Nota: slug, nombre_completo, foto_url, cal_username, botones_config, tema_config
-- ya existen en tu BD actual, no es necesario agregarlas

-- Si necesitás agregar columnas opcionales en el futuro:
-- ALTER TABLE clients
-- ADD COLUMN IF NOT EXISTS especialidad varchar(255),
-- ADD COLUMN IF NOT EXISTS matricula varchar(100),
-- ADD COLUMN IF NOT EXISTS mensaje text,
-- ADD COLUMN IF NOT EXISTS biolink_activo boolean DEFAULT true;

-- Crear índice en slug si no existe (para búsquedas rápidas)
-- Nota: Si slug ya es PRIMARY KEY, este índice no es necesario
-- CREATE INDEX IF NOT EXISTS idx_clients_slug ON clients(slug);

-- Comentarios para documentación
COMMENT ON COLUMN clients.slug IS 'URL amigable única para el biolink (ej: dr-juan-perez) - PRIMARY KEY';
COMMENT ON COLUMN clients.nombre_completo IS 'Nombre completo del profesional';
COMMENT ON COLUMN clients.foto_url IS 'URL de la foto de perfil';
COMMENT ON COLUMN clients.cal_username IS 'Username de Cal.com (ej: dr-juan/30min)';
COMMENT ON COLUMN clients.botones_config IS 'Configuración de botones en formato JSON';
COMMENT ON COLUMN clients.tema_config IS 'Configuración de colores y tema en formato JSON';
