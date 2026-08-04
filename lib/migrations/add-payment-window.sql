-- Migración: ventana de pago configurable + deadline por reserva
-- Correr manualmente en Neon ANTES de deployar código.
-- Archivo: lib/migrations/add-payment-window.sql

-- 1) Ventana configurable por profesional (minutos). Default 120 = 2h.
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS payment_window_minutes INTEGER NOT NULL DEFAULT 120;

COMMENT ON COLUMN clients.payment_window_minutes IS
  'Minutos para pagar antes de que la reserva expire y el slot se libere. Default 120 (2h).';

-- 2) Deadline explícito por reserva (snapshot al crear).
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

COMMENT ON COLUMN bookings.expires_at IS
  'Expiración del pending_payment. Se calcula al crear = min(now() + ventana, fecha_hora). NULL = no expira (comportamiento actual).';

-- 3) Backfill AMISTOSO: ventana fresca desde ahora para todas las pending_payment vivas.
--    NO se usa created_at porque es TIMESTAMP en UTC y generaría cancelación masiva
--    en el primer barrido del cron con mails retroactivos a pacientes de turnos viejos.
--    Las reservas con fecha_hora pasada quedan con expires_at en el pasado → el cron
--    las cancela en el primer barrido SIN mail (regla: mail solo si fecha_hora > now()).
UPDATE bookings
SET expires_at = LEAST(
      now() + interval '120 minutes',
      fecha_hora
    )
WHERE estado = 'pending_payment'
  AND expires_at IS NULL;

-- 4) Índice para la consulta de disponibilidad (lazy) y barridos del cron.
CREATE INDEX IF NOT EXISTS idx_bookings_pending_expiry
  ON bookings (client_id, estado, expires_at);
