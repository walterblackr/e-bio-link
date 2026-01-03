# 🔐 Sistema de Autenticación de Administradores

Sistema completo de login para proteger el panel de administración de e-bio-link.

## 📋 Características

- ✅ Login con email y contraseña
- ✅ Contraseñas hasheadas con bcrypt
- ✅ Sesiones seguras con cookies HttpOnly
- ✅ Middleware para proteger rutas `/admin/*`
- ✅ Logout funcional
- ✅ Redirección automática si no está autenticado

---

## 🚀 Configuración Inicial

### Paso 1: Crear tabla de admins en Neon

Ejecutá este SQL en tu consola de Neon:

```sql
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL UNIQUE,
  password_hash text NOT NULL,
  nombre varchar(255) NOT NULL,
  activo boolean DEFAULT true,
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
```

### Paso 2: Generar hash de contraseña

Usá el script para generar un hash seguro:

```bash
npx tsx scripts/generate-admin-password.ts TuContraseñaSegura123
```

Esto te dará un hash que podés insertar en la BD.

### Paso 3: Insertar primer admin

```sql
INSERT INTO admins (email, password_hash, nombre, activo)
VALUES (
  'admin@ebiolink.com',
  '$2b$10$EL_HASH_QUE_GENERASTE',
  'Administrador',
  true
);
```

---

## 🔑 Uso

### Login

1. Ir a: `https://e-bio-link.vercel.app/admin/login`
2. Ingresar email y contraseña
3. Si son correctos, redirige a `/admin/generate-links`

### Acceder al Panel

- Todas las rutas `/admin/*` (excepto `/admin/login`) requieren autenticación
- Si no estás logueado, te redirige automáticamente a `/admin/login`
- La sesión dura **7 días**

### Logout

- Click en "Cerrar Sesión" en el panel
- O ir a: `POST /api/admin/logout`

---

## 📁 Estructura de Archivos

```
/lib/auth/
  └── admin-auth.ts          # Helper de autenticación

/pages/api/admin/
  ├── login.ts               # API de login
  └── logout.ts              # API de logout

/app/(admin)/admin/
  ├── login/page.tsx         # Página de login
  └── generate-links/page.tsx # Panel protegido

/middleware.ts               # Protege rutas /admin

/lib/migrations/
  └── create-admins-table.sql

/scripts/
  └── generate-admin-password.ts
```

---

## 🔒 Seguridad

### Contraseñas
- ✅ Hasheadas con **bcrypt** (10 rounds)
- ✅ Nunca se almacenan en texto plano
- ✅ Nunca se devuelven en las APIs

### Cookies
- ✅ **HttpOnly**: No accesibles desde JavaScript
- ✅ **Secure**: Solo HTTPS en producción
- ✅ **SameSite**: Protección contra CSRF
- ✅ **MaxAge**: 7 días

### Middleware
- ✅ Verifica sesión en **cada request**
- ✅ Redirige a login si no hay sesión
- ✅ Valida que el admin siga activo en BD

---

## 🛠️ APIs

### POST /api/admin/login

**Request:**
```json
{
  "email": "admin@ebiolink.com",
  "password": "TuContraseña123"
}
```

**Response (200):**
```json
{
  "success": true,
  "admin": {
    "id": "uuid",
    "email": "admin@ebiolink.com",
    "nombre": "Administrador"
  }
}
```

**Response (401):**
```json
{
  "error": "Credenciales inválidas"
}
```

### POST /api/admin/logout

**Request:** Vacío

**Response (200):**
```json
{
  "success": true
}
```

---

## 👥 Agregar Más Admins

### Opción 1: Manual (SQL)

```sql
-- 1. Generar hash
-- npx tsx scripts/generate-admin-password.ts NuevaContraseña123

-- 2. Insertar
INSERT INTO admins (email, password_hash, nombre, activo)
VALUES (
  'nuevo@ebiolink.com',
  '$2b$10$HASH_GENERADO',
  'Nuevo Admin',
  true
);
```

### Opción 2: Crear API (futuro)

Podrías crear `/api/admin/create-admin` para que un admin pueda crear otros.

---

## 🚨 Troubleshooting

### "Credenciales inválidas"

- Verificá que el email esté en la BD
- Verificá que `activo = true`
- Generá un nuevo hash de contraseña

```sql
SELECT email, activo FROM admins WHERE email = 'tu@email.com';
```

### "No autorizado" al acceder a /admin

- Limpiá cookies del navegador
- Volvé a hacer login
- Verificá que la cookie `admin_session` esté presente

### La sesión se pierde

- Verificá que `DATABASE_URL` esté configurada en Vercel
- Verificá que el admin siga `activo = true` en la BD

```sql
UPDATE admins SET activo = true WHERE email = 'admin@ebiolink.com';
```

---

## 📝 Variables de Entorno

```env
DATABASE_URL=postgresql://...  # Neon PostgreSQL
NODE_ENV=production            # Para cookies seguras
```

---

## 🔄 Cambiar Contraseña

```bash
# 1. Generar nuevo hash
npx tsx scripts/generate-admin-password.ts NuevaContraseña456

# 2. Actualizar en BD
UPDATE admins
SET password_hash = '$2b$10$NUEVO_HASH'
WHERE email = 'admin@ebiolink.com';
```

---

## 📞 Soporte

Para problemas o consultas:
- WhatsApp: https://wa.me/5492994091255
- Email: contacto@ebiolink.com

---

## 📄 Licencia

© 2025 E-Bio-Link - Todos los derechos reservados
