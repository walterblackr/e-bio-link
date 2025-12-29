# 🚀 Guía Completa - Sistema de OAuth Mercado Pago

## ✅ Solución Simple sin Login de Usuarios

**Vos generás los links manualmente desde un panel y se los enviás a tus clientes por WhatsApp/Email.**

---

## 📁 Archivos del Sistema

### Archivos Principales

- `app/admin/generate-links/page.tsx` - Panel de administración
- `pages/api/callback.ts` - Recibe respuesta de Mercado Pago
- `pages/api/generate-auth-link.ts` - Genera links (usado por el panel)
- `lib/mercadopago-auth.ts` - Lógica compartida

### Archivos Opcionales (útiles)

- `pages/api/health-check.ts` - Monitorear estado de tokens
- `pages/api/revoke-access.ts` - Revocar acceso de un cliente
- `scripts/emergency-revoke-all.ts` - Revocar todos los tokens (emergencia)

---

## 📋 Pasos para Conectar un Cliente

### 1. Entrás al Panel de Admin

```
https://tu-dominio.vercel.app/admin/generate-links
```

### 2. Completás el formulario

- **Nombre del Cliente:** `Dr. Juan Pérez`
- **Clave de Admin:** Tu `ADMIN_SECRET_KEY` (solo vos la conocés)

### 3. Hacés clic en "Generar Link"

El sistema genera un link único:
```
https://auth.mercadopago.com/authorization?client_id=...&state=550e8400-...
```

### 4. Copiás y enviás al cliente

**Opción A: Copiar solo el link**
```
https://auth.mercadopago.com/authorization?...
```

**Opción B: Copiar mensaje completo**
```
Hola! Para conectar tu cuenta de Mercado Pago, ingresá a este link:

https://auth.mercadopago.com/authorization?...

El link expira en 24 horas.
```

### 5. Cliente hace clic y autoriza

```
Cliente → Click en link → Mercado Pago → Autoriza → ✅ Conectado
```

---

## 🔐 Seguridad

### ¿Puede alguien más generar links?

**NO**, porque:

1. ✅ Necesitan tu `ADMIN_SECRET_KEY`
2. ✅ Solo vos la conocés (está en Vercel)
3. ✅ Sin la clave, el endpoint rechaza la petición

### ¿Puede un atacante robar un link?

**Incluso si lo roba:**

1. ⏰ El link expira en 24 horas
2. 🔒 Solo se puede usar una vez
3. 🎯 El token se guarda con el nombre del cliente original
4. 🔐 El UUID es impredecible (imposible de adivinar)

---

## 📱 Cómo Enviar los Links

### Por WhatsApp

```
Hola Dr. Juan! 👋

Para conectar tu cuenta de Mercado Pago y empezar a recibir pagos:

1. Ingresá a este link:
https://auth.mercadopago.com/...

2. Iniciá sesión con tu cuenta de Mercado Pago

3. Autorizá la conexión

4. ¡Listo! ✅

El link expira en 24 horas.

Cualquier duda, avisame!
```

### Por Email

```
Asunto: Conectá tu cuenta de Mercado Pago

Hola Dr. Juan,

Para que puedas empezar a recibir pagos, necesito que conectes tu cuenta de Mercado Pago.

Seguí estos pasos:

1. Hacé clic acá: https://auth.mercadopago.com/...
2. Iniciá sesión con tu cuenta de Mercado Pago
3. Autorizá la conexión
4. ¡Listo!

El link es válido por 24 horas.

Saludos!
```

---

## 🛠️ Configuración Inicial

### 1. Generar tu ADMIN_SECRET_KEY

```bash
# En tu terminal
openssl rand -hex 32
```

Resultado (ejemplo):
```
4f3d2a1b7e9c8f6a5d4e3b2c1a9f8e7d6c5b4a3e2f1d0c9b8a7f6e5d4c3b2a1
```

### 2. Configurar en Vercel

1. Entrá a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agregá:

```
ADMIN_SECRET_KEY=4f3d2a1b7e9c8f6a5d4e3b2c1a9f8e7d6c5b4a3e2f1d0c9b8a7f6e5d4c3b2a1
```

4. Redeploy tu proyecto

### 3. Guardar la clave en lugar seguro

⚠️ **MUY IMPORTANTE:**
- Guardala en un gestor de contraseñas (1Password, Bitwarden, etc.)
- NO la compartas con nadie
- NO la subas a GitHub
- NO la pongas en mensajes de WhatsApp/Email

---

## 📊 Ejemplo de Flujo Completo

### Día 1: Nuevo cliente

1. **Vos:** Entrás a `/admin/generate-links`
2. **Vos:** Ingresás "Dr. Juan Pérez" + tu clave
3. **Sistema:** Genera link único
4. **Vos:** Copiás y enviás por WhatsApp
5. **Cliente:** Recibe el link en WhatsApp
6. **Cliente:** Hace clic → Mercado Pago → Autoriza
7. **Sistema:** Guarda token en la BD
8. **Resultado:** ✅ Cliente conectado

### Más adelante: Crear cobros

```typescript
// En tu código, cuando necesites cobrar
const sql = neon(process.env.DATABASE_URL);

// Buscar token del cliente por nombre
const result = await sql`
  SELECT mp_access_token
  FROM clients
  WHERE client_name = 'Dr. Juan Pérez'
`;

const token = result[0].mp_access_token;

// Crear cobro a nombre del cliente
await axios.post('https://api.mercadopago.com/v1/payments', {
  transaction_amount: 5000,
  description: 'Consulta médica',
  // ...
}, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 🎯 Ventajas de esta Solución

✅ **Simple:** No necesitás sistema de login
✅ **Seguro:** Solo vos podés generar links
✅ **Rápido:** Generás y enviás en 30 segundos
✅ **Confiable:** Links con expiración y uso único
✅ **Escalable:** Podés generar links para 100s de clientes

---

## ❓ FAQ

### ¿Qué pasa si se me pierde la ADMIN_SECRET_KEY?

1. Generá una nueva: `openssl rand -hex 32`
2. Actualizala en Vercel
3. Usá la nueva clave en el panel

### ¿Puede un cliente generar su propio link?

No. Solo vos con la `ADMIN_SECRET_KEY` podés generar links.

### ¿Qué pasa si el cliente no usa el link en 24 horas?

El link expira. Generás uno nuevo y se lo enviás de vuelta.

### ¿Puede un cliente conectar 2 cuentas de Mercado Pago?

Sí, pero solo la última quedará activa. Si conecta otra cuenta, se actualiza el token.

### ¿Cómo revoco el acceso de un cliente?

Usá el endpoint `/api/revoke-access` (ver [SECURITY.md](./SECURITY.md))

---

## 🚀 Próximos Pasos

1. ✅ Configurá `ADMIN_SECRET_KEY` en Vercel
2. ✅ Probá generar un link de prueba
3. ✅ Enviale el link a un cliente real
4. ✅ Verificá que se conecte correctamente
5. ✅ Implementá la lógica para crear cobros

---

**¿Dudas?** Todo está listo para usar. Solo necesitás configurar la clave en Vercel y ya podés empezar a generar links.
