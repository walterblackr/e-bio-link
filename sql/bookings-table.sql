-- Tabla para trackear reservas y pagos
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,

  -- Relación con el cliente (médico)
  client_slug VARCHAR(255) NOT NULL REFERENCES clients(slug) ON DELETE CASCADE,

  -- Datos de Cal.com
  cal_booking_id VARCHAR(255) UNIQUE,
  cal_event_type_id VARCHAR(255),

  -- Datos del paciente
  paciente_nombre VARCHAR(255) NOT NULL,
  paciente_email VARCHAR(255) NOT NULL,
  paciente_telefono VARCHAR(50),

  -- Fecha y hora de la cita
  fecha_hora TIMESTAMP NOT NULL,
  duracion_minutos INTEGER DEFAULT 30,

  -- Datos del pago
  mp_preference_id VARCHAR(255),
  mp_payment_id VARCHAR(255),
  mp_payment_status VARCHAR(50) DEFAULT 'pending',
  monto DECIMAL(10, 2),

  -- Estado del booking
  estado VARCHAR(50) DEFAULT 'pending', -- pending, paid, confirmed, cancelled

  -- Notas adicionales
  notas TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP,
  confirmed_at TIMESTAMP
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_bookings_client_slug ON bookings(client_slug);
CREATE INDEX IF NOT EXISTS idx_bookings_cal_booking_id ON bookings(cal_booking_id);
CREATE INDEX IF NOT EXISTS idx_bookings_mp_payment_id ON bookings(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_estado ON bookings(estado);
CREATE INDEX IF NOT EXISTS idx_bookings_paciente_email ON bookings(paciente_email);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_bookings_updated_at();
