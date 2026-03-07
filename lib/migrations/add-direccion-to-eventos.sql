ALTER TABLE eventos
ADD COLUMN IF NOT EXISTS direccion varchar(500);

COMMENT ON COLUMN eventos.direccion IS 'Dirección del consultorio (solo para modalidad presencial)';
