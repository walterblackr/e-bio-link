-- Migration: Add modalidad field to eventos table
-- Run in Neon Console

ALTER TABLE eventos
ADD COLUMN IF NOT EXISTS modalidad varchar(20) DEFAULT 'virtual';

COMMENT ON COLUMN eventos.modalidad IS 'Event modality: virtual (Google Meet) or presencial (in-person)';

-- Note: cal_event_type_id and cal_slug columns remain for backward compatibility
-- but are no longer written to by new code
