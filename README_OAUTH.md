# 🔐 Sistema OAuth de Mercado Pago

Sistema simple y seguro para conectar cuentas de Mercado Pago de tus clientes.

---

## 🎯 ¿Qué hace?

Permite que tus clientes (médicos, profesionales, etc.) conecten sus cuentas de Mercado Pago para que vos puedas crear cobros en su nombre.

---

## 📂 Estructura de Archivos

```
e-bio-link/
├── app/admin/generate-links/
│   └── page.tsx                    # 🎨 Panel de admin (tu herramienta principal)
│
├── pages/api/
│   ├── callback.ts                 # 🔄 Recibe respuesta de Mercado Pago
│   ├── generate-auth-link.ts       # 🔗 Genera links (usado por el panel)
│   ├── health-check.ts             # 🏥 Monitorea tokens
│   └── revoke-access.ts            # 🗑️ Revoca accesos
│
├── lib/
│   └── mercadopago-auth.ts         # 🧰 Lógica compartida
│
├── scripts/
│   └── emergency-revoke-all.ts     # 🚨 Revocación de emergencia
│
└── docs/
    ├── USO_SIMPLE.md               # 📖 Guía de uso
    └── SECURITY.md                 # 🔒 Explicación de seguridad
```

---

## 🚀 Inicio Rápido

### 1. Configurar Variables de Entorno

```bash
# Generar clave de admin
openssl rand -hex 32
```

Agregar en Vercel:

```env
# Mercado Pago
MP_CLIENT_ID=tu_client_id
MP_CLIENT_SECRET=tu_client_secret
MP_REDIRECT_URI=https://tu-dominio.vercel.app/api/callback

# Base de Datos
DATABASE_URL=postgresql://...

# Admin (la clave que generaste)
ADMIN_SECRET_KEY=tu_clave_generada
```

### 2. Usar el Panel

```
https://tu-dominio.vercel.app/admin/generate-links
```

1. Ingresar nombre del cliente
2. Ingresar ADMIN_SECRET_KEY
3. Copiar link generado
4. Enviar al cliente por WhatsApp/Email

### 3. Cliente Conecta

Cliente → Click en link → Autoriza en Mercado Pago → ✅ Listo

---

## 🔐 Seguridad

✅ **Solo vos** podés generar links (con ADMIN_SECRET_KEY)
✅ **Links impredecibles** (UUIDs aleatorios)
✅ **Expiran en 24 horas** (uso limitado)
✅ **Uso único** (no se pueden reutilizar)
✅ **Tokens guardados seguros** (nunca expuestos al cliente)

---

## 📊 Base de Datos

### Tablas Creadas Automáticamente

**`oauth_sessions`** - Sesiones temporales
```sql
CREATE TABLE oauth_sessions (
  session_id uuid PRIMARY KEY,
  user_id varchar(255),
  client_name varchar(255),
  status varchar(50) DEFAULT 'pending',
  created_at timestamp DEFAULT NOW()
);
```

**`clients`** - Tokens de Mercado Pago
```sql
CREATE TABLE clients (
  id uuid PRIMARY KEY,
  user_id varchar(255),
  client_name varchar(255),
  mp_access_token text NOT NULL,
  mp_user_id varchar(255) UNIQUE,
  mp_refresh_token text,
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);
```

---

## 🛠️ Endpoints

### Panel de Admin
```
GET /admin/generate-links
```
Interfaz visual para generar links.

### Generar Link (API)
```bash
POST /api/generate-auth-link
Content-Type: application/json

{
  "clientName": "Dr. Juan Pérez",
  "adminKey": "tu_ADMIN_SECRET_KEY"
}
```

### Health Check
```bash
GET /api/health-check?adminKey=tu_clave
```

### Revocar Acceso
```bash
POST /api/revoke-access
Content-Type: application/json

{
  "clientId": "uuid-del-cliente",
  "adminKey": "tu_ADMIN_SECRET_KEY"
}
```

---

## 📱 Mensaje para Clientes

```
Hola! 👋

Para conectar tu cuenta de Mercado Pago:

1. Ingresá a este link:
[LINK_GENERADO]

2. Iniciá sesión con tu cuenta de Mercado Pago

3. Autorizá la conexión

El link expira en 24 horas.
```

---

## 🔄 Flujo Completo

```
1. VOS generas link en /admin/generate-links
   ↓
2. Envías link al cliente por WhatsApp
   ↓
3. Cliente hace clic → Mercado Pago
   ↓
4. Cliente autoriza
   ↓
5. Mercado Pago redirige a /api/callback
   ↓
6. Callback guarda token en BD
   ↓
7. ✅ Cliente ve mensaje de éxito
```

---

## 🧪 Crear Cobros (Ejemplo)

```typescript
import { neon } from '@neondatabase/serverless';
import axios from 'axios';

const sql = neon(process.env.DATABASE_URL);

// Obtener token del cliente
const result = await sql`
  SELECT mp_access_token
  FROM clients
  WHERE client_name = 'Dr. Juan Pérez'
`;

const token = result[0].mp_access_token;

// Crear cobro
const payment = await axios.post(
  'https://api.mercadopago.com/v1/payments',
  {
    transaction_amount: 5000,
    description: 'Consulta médica',
    payment_method_id: 'pix',
    payer: { email: 'paciente@example.com' }
  },
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Idempotency-Key': crypto.randomUUID()
    }
  }
);

// El dinero cae en la cuenta del Dr. Juan Pérez
```

---

## 📚 Documentación

- [USO_SIMPLE.md](./docs/USO_SIMPLE.md) - Guía paso a paso
- [SECURITY.md](./docs/SECURITY.md) - Explicación de seguridad

---

## ❓ FAQ

### ¿Necesito crear usuarios en mi BD?
No. Solo usás tu ADMIN_SECRET_KEY.

### ¿El cliente ve el token de Mercado Pago?
No. El token nunca sale del servidor.

### ¿Qué pasa si se filtra mi ADMIN_SECRET_KEY?
Generás una nueva y actualizás en Vercel.

### ¿Cuántos clientes puedo conectar?
Ilimitados.

---

## 🚨 En Caso de Emergencia

### Revocar todos los tokens
```bash
npx tsx scripts/emergency-revoke-all.ts
```

### Rotar ADMIN_SECRET_KEY
1. Generar nueva: `openssl rand -hex 32`
2. Actualizar en Vercel
3. Usar nueva clave en el panel

---

**Última actualización:** 2025-12-28
