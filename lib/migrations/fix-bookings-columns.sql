-- Migration: Fix bookings table for Google Calendar integration
-- Run in Neon Console BEFORE using the booking flow
-- This replaces the previous update-bookings-for-google.sql

-- Add columns that may not exist yet (idempotent)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS google_event_id varchar(255),
ADD COLUMN IF NOT EXISTS meet_link varchar(500),
ADD COLUMN IF NOT EXISTS comprobante_url varchar(500),
ADD COLUMN IF NOT EXISTS payment_method varchar(20) DEFAULT 'transfer',
ADD COLUMN IF NOT EXISTS notas text;

-- evento_id needs to be UUID (not INTEGER) since eventos.id is UUID
-- First drop the INTEGER version if it exists, then add UUID version
DO $$
BEGIN
  -- Drop INTEGER column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings'
      AND column_name = 'evento_id'
      AND data_type = 'integer'
  ) THEN
    ALTER TABLE bookings DROP COLUMN evento_id;
  END IF;

  -- Add UUID version if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings'
      AND column_name = 'evento_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN evento_id UUID REFERENCES eventos(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bookings_google_event_id ON bookings(google_event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_evento_id ON bookings(evento_id);

-- Note: cal_booking_id column remains for backward compatibility
