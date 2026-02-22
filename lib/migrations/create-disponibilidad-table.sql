-- Migration: Create disponibilidad (availability) table
-- Run in Neon Console

CREATE TABLE IF NOT EXISTS disponibilidad (
  id SERIAL PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(client_id, dia_semana)
);

COMMENT ON TABLE disponibilidad IS 'Availability configuration per professional per day of week';
COMMENT ON COLUMN disponibilidad.dia_semana IS '0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';

CREATE INDEX IF NOT EXISTS idx_disponibilidad_client_id ON disponibilidad(client_id);
