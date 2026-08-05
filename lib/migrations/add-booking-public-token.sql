-- Migración: token público para links de reserva en emails
-- Correr manualmente en Neon ANTES de deployar código.
-- Archivo: lib/migrations/add-booking-public-token.sql

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS public_token UUID NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_public_token
  ON bookings (public_token);

COMMENT ON COLUMN bookings.public_token IS
  'Token aleatorio para links públicos en emails (retorno del paciente). Nunca exponer el id serial en URLs externas.';
