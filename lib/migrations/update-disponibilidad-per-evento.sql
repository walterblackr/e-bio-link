-- Migración: Disponibilidad por evento + configuración avanzada
-- Ejecutar en Neon console

-- 1. Agregar evento_id a disponibilidad (FK a eventos)
-- eventos.id es UUID, no INTEGER
ALTER TABLE disponibilidad
ADD COLUMN IF NOT EXISTS evento_id UUID REFERENCES eventos(id) ON DELETE CASCADE;

-- 2. Eliminar constraint único global (permite múltiples bloques por día por evento)
ALTER TABLE disponibilidad
DROP CONSTRAINT IF EXISTS disponibilidad_client_id_dia_semana_key;

-- 3. Índices de performance
CREATE INDEX IF NOT EXISTS idx_disponibilidad_evento_id ON disponibilidad(evento_id);
CREATE INDEX IF NOT EXISTS idx_disponibilidad_client_dia ON disponibilidad(client_id, dia_semana);

-- 4. Campos de configuración avanzada en eventos
ALTER TABLE eventos
ADD COLUMN IF NOT EXISTS buffer_antes INTEGER DEFAULT 0,      -- minutos de buffer antes del turno
ADD COLUMN IF NOT EXISTS buffer_despues INTEGER DEFAULT 0,    -- minutos de buffer después del turno
ADD COLUMN IF NOT EXISTS antelacion_minima INTEGER DEFAULT 0, -- minutos de antelación mínima para reservar
ADD COLUMN IF NOT EXISTS max_por_dia INTEGER DEFAULT NULL;    -- NULL = sin límite de turnos por día

COMMENT ON COLUMN disponibilidad.evento_id IS 'Evento al que pertenece esta disponibilidad. NULL = disponibilidad global legacy (deprecated)';
COMMENT ON COLUMN eventos.buffer_antes IS 'Minutos de descanso antes de cada turno de este tipo';
COMMENT ON COLUMN eventos.buffer_despues IS 'Minutos de descanso después de cada turno de este tipo';
COMMENT ON COLUMN eventos.antelacion_minima IS 'Minutos de anticipación mínima requerida para reservar';
COMMENT ON COLUMN eventos.max_por_dia IS 'Máximo de turnos de este tipo por día. NULL = sin límite';
