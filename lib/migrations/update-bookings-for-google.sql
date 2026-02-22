-- Migration: Add Google Calendar and transfer fields to bookings
-- Run in Neon Console

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS google_event_id varchar(255),
ADD COLUMN IF NOT EXISTS meet_link varchar(500),
ADD COLUMN IF NOT EXISTS comprobante_url varchar(500),
ADD COLUMN IF NOT EXISTS payment_method varchar(20) DEFAULT 'mp',
ADD COLUMN IF NOT EXISTS evento_id INTEGER;

COMMENT ON COLUMN bookings.google_event_id IS 'Google Calendar event ID for this booking';
COMMENT ON COLUMN bookings.meet_link IS 'Google Meet link if virtual event';
COMMENT ON COLUMN bookings.comprobante_url IS 'URL of bank transfer receipt image (Cloudinary)';
COMMENT ON COLUMN bookings.payment_method IS 'How this booking was paid: mp or transfer';
COMMENT ON COLUMN bookings.evento_id IS 'Reference to the event type booked';

CREATE INDEX IF NOT EXISTS idx_bookings_google_event_id ON bookings(google_event_id);

-- Note: cal_booking_id column remains for backward compatibility
-- but is no longer written to by new code
