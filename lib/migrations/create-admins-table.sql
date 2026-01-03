-- Crear tabla de administradores
-- Ejecutar en consola de Neon

CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL UNIQUE,
  password_hash text NOT NULL,
  nombre varchar(255) NOT NULL,
  activo boolean DEFAULT true,
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);

-- Crear índice en email para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Comentarios
COMMENT ON TABLE admins IS 'Usuarios administradores del sistema';
COMMENT ON COLUMN admins.email IS 'Email único del admin';
COMMENT ON COLUMN admins.password_hash IS 'Hash bcrypt de la contraseña';
COMMENT ON COLUMN admins.nombre IS 'Nombre completo del administrador';
COMMENT ON COLUMN admins.activo IS 'Si el admin puede iniciar sesión';

-- Para insertar un admin, primero generá el hash de tu contraseña:
-- npx tsx scripts/generate-admin-password.ts TuContraseñaSegura
--
-- Luego ejecutá:
-- INSERT INTO admins (email, password_hash, nombre, activo)
-- VALUES (
--   'tu-email@example.com',
--   'EL_HASH_QUE_GENERASTE',
--   'Tu Nombre',
--   true
-- );

-- Verificar admins existentes
SELECT id, email, nombre, activo, created_at FROM admins;
