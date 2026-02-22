-- Migration: Add Google Calendar OAuth fields to clients
-- Run in Neon Console

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS google_access_token text,
ADD COLUMN IF NOT EXISTS google_refresh_token text,
ADD COLUMN IF NOT EXISTS google_email varchar(255),
ADD COLUMN IF NOT EXISTS google_calendar_id varchar(255) DEFAULT 'primary',
ADD COLUMN IF NOT EXISTS google_token_expiry timestamp;

COMMENT ON COLUMN clients.google_access_token IS 'Encrypted Google OAuth2 access token';
COMMENT ON COLUMN clients.google_refresh_token IS 'Encrypted Google OAuth2 refresh token';
COMMENT ON COLUMN clients.google_email IS 'Google account email used for calendar';
COMMENT ON COLUMN clients.google_calendar_id IS 'Google Calendar ID to use (default: primary)';
COMMENT ON COLUMN clients.google_token_expiry IS 'When the access token expires';
