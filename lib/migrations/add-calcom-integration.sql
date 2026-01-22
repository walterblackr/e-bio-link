-- Migración para agregar integración con Cal.com mediante API Key
-- El cliente genera su propia API Key en Cal.com y la proporciona

-- Agregar campos a la tabla clients
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS cal_api_key text,
ADD COLUMN IF NOT EXISTS cal_username varchar(100),
ADD COLUMN IF NOT EXISTS cal_event_type_id integer;

-- Comentarios para documentación
COMMENT ON COLUMN clients.cal_api_key IS 'API Key de Cal.com del cliente (encriptada)';
COMMENT ON COLUMN clients.cal_username IS 'Username de Cal.com del cliente';
COMMENT ON COLUMN clients.cal_event_type_id IS 'ID del event type principal en Cal.com';

-- Índice para búsquedas por username
CREATE INDEX IF NOT EXISTS idx_clients_cal_username ON clients(cal_username);
