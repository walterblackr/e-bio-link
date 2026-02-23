-- Migration: Add notas column to bookings
-- Run in Neon Console

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS notas text;

COMMENT ON COLUMN bookings.notas IS 'Notas o motivo de consulta ingresado por el paciente al reservar';
