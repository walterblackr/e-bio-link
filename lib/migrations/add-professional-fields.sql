-- Agregar campos profesionales a la tabla clients
-- Ejecutar en consola de Neon

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS especialidad varchar(255) DEFAULT '',
ADD COLUMN IF NOT EXISTS matricula varchar(100) DEFAULT '',
ADD COLUMN IF NOT EXISTS descripcion text DEFAULT '';

-- Comentarios para documentación
COMMENT ON COLUMN clients.especialidad IS 'Especialidad médica o profesional (ej: Cardiólogo, Nutricionista)';
COMMENT ON COLUMN clients.matricula IS 'Número de matrícula profesional (ej: MN 12345, MP 54321)';
COMMENT ON COLUMN clients.descripcion IS 'Descripción o mensaje personalizado para el biolink';

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, character_maximum_length, column_default
FROM information_schema.columns
WHERE table_name = 'clients'
  AND column_name IN ('especialidad', 'matricula', 'descripcion');
