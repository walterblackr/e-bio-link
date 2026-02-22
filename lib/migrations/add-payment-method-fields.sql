-- Migration: Add payment method fields to clients
-- Run in Neon Console

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS payment_method varchar(20) DEFAULT 'mp',
ADD COLUMN IF NOT EXISTS cbu_alias varchar(100),
ADD COLUMN IF NOT EXISTS banco_nombre varchar(100),
ADD COLUMN IF NOT EXISTS titular_cuenta varchar(255);

COMMENT ON COLUMN clients.payment_method IS 'Payment method: mp (Mercado Pago) or transfer (bank transfer)';
COMMENT ON COLUMN clients.cbu_alias IS 'CBU or Alias for bank transfers';
COMMENT ON COLUMN clients.banco_nombre IS 'Bank name for transfers';
COMMENT ON COLUMN clients.titular_cuenta IS 'Account holder name for transfers';
