-- Agrega soporte para cobro parcial (seña) por tipo de consulta
ALTER TABLE eventos
  ADD COLUMN IF NOT EXISTS cobro_tipo VARCHAR(20) DEFAULT 'total',
  ADD COLUMN IF NOT EXISTS sena_monto NUMERIC(10,2);

COMMENT ON COLUMN eventos.cobro_tipo IS 'total = cobra el precio completo al reservar; sena = cobra sena_monto como adelanto';
COMMENT ON COLUMN eventos.sena_monto IS 'Monto fijo de la seña en ARS cuando cobro_tipo = sena';
