-- Agregar campo para monto de consulta configurable por médico
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS monto_consulta DECIMAL(10, 2) DEFAULT 10000.00;

COMMENT ON COLUMN clients.monto_consulta IS 'Precio de la consulta en ARS. Default: $10,000';
