# 🔐 Guía de Seguridad - OAuth Mercado Pago

## ⚠️ Pregunta Importante: ¿Puede un atacante generar links?

### Respuesta Corta: **NO, si seguís las recomendaciones**

---

## 🛡️ Arquitectura de Seguridad

### Capas de Protección

```
┌─────────────────────────────────────────────────────┐
│ CAPA 1: Autenticación de Usuario                   │
│ Solo usuarios logueados pueden generar links       │
├─────────────────────────────────────────────────────┤
│ CAPA 2: UUID Impredecibles                         │
│ Los links usan UUIDs, no slugs adivinables         │
├─────────────────────────────────────────────────────┤
│ CAPA 3: Sesiones con Expiración                    │
│ Los links expiran en 24 horas                      │
├─────────────────────────────────────────────────────┤
│ CAPA 4: Validación One-Time                        │
│ Cada link solo se puede usar una vez               │
├─────────────────────────────────────────────────────┤
│ CAPA 5: Admin Key para Endpoints Administrativos   │
│ Operaciones sensibles requieren ADMIN_SECRET_KEY   │
└─────────────────────────────────────────────────────┘
```

---

## 📋 3 Formas de Generar Links (de más a menos segura)

### ✅ **Opción 1: Server-Side Rendering (RECOMENDADO)**

**Archivo:** `app/dashboard/connect-mp/page.tsx`

```typescript
// El link se genera en el servidor, nunca expuesto al cliente
export default async function ConnectMercadoPagoPage() {
  const user = await getCurrentUser(); // Tu autenticación

  if (!user) redirect('/login'); // Redirige si no está logueado

  // Genera link de forma segura
  const { authUrl } = await generateMercadoPagoAuthLink({
    userId: user.id,
    clientName: user.name,
  });

  return <a href={authUrl}>Conectar Mercado Pago</a>;
}
```

**Ventajas:**
- ✅ Sin endpoint público expuesto
- ✅ Link generado server-side
- ✅ Autenticación automática
- ✅ Imposible de llamar sin estar logueado

**Desventajas:**
- Requiere que tu app use Next.js App Router

---

### ✅ **Opción 2: API Protegida con Autenticación**

**Archivo:** `pages/api/connect-mercadopago.ts`

```typescript
// Endpoint protegido con tu sistema de autenticación
const user = await getAuthenticatedUser(req);

if (!user) {
  return res.status(401).json({ error: 'Unauthorized' });
}

const { authUrl } = await generateMercadoPagoAuthLink({
  userId: user.id, // Solo puede generar para sí mismo
  clientName: user.name,
});
```

**Cómo llamarlo desde el frontend:**

```typescript
// En tu componente React
async function handleConnectMP() {
  // El usuario YA DEBE estar logueado (con cookie de sesión)
  const response = await fetch('/api/connect-mercadopago', {
    method: 'POST',
    credentials: 'include', // Envía cookies de sesión
  });

  if (response.ok) {
    const { authUrl } = await response.json();
    window.location.href = authUrl; // Redirige a Mercado Pago
  }
}
```

**Ventajas:**
- ✅ Compatible con Pages Router
- ✅ El usuario solo puede generar para sí mismo
- ✅ Usa tu sistema de autenticación existente

**Desventajas:**
- Requiere implementar autenticación (NextAuth, JWT, etc.)

---

### ⚠️ **Opción 3: Endpoint Administrativo (SOLO INTERNO)**

**Archivo:** `pages/api/generate-auth-link.ts`

```bash
# Solo desde scripts internos o backend
curl -X POST https://tu-dominio.vercel.app/api/generate-auth-link \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_12345",
    "clientName": "Dr. Juan",
    "adminKey": "tu_clave_super_secreta"
  }'
```

**Ventajas:**
- ✅ Útil para scripts administrativos
- ✅ Puedes generar links para cualquier usuario

**Desventajas:**
- ⚠️ NO usar desde el frontend (expone adminKey)
- ⚠️ Solo para uso interno/servidor

---

## 🚨 Escenarios de Ataque y Defensas

### Ataque 1: "Adivinar URLs de autorización"

**Ataque:**
```
https://auth.mercadopago.com/authorization?state=dr_juan
```

**Defensa:**
```typescript
// Usamos UUIDs impredecibles
state=550e8400-e29b-41d4-a716-446655440000

// El callback valida formato UUID
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) {
  return res.status(400).send('Sesión Inválida');
}
```

**Probabilidad de adivinar un UUID:** 1 en 5.3 × 10³⁶ (prácticamente imposible)

---

### Ataque 2: "Llamar al endpoint sin autenticación"

**Ataque:**
```bash
curl -X POST https://tu-dominio.vercel.app/api/connect-mercadopago
```

**Defensa:**
```typescript
const user = await getAuthenticatedUser(req);

if (!user) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

**Resultado:** ❌ Rechazado - No hay sesión

---

### Ataque 3: "Reutilizar un link viejo"

**Ataque:**
```
Usuario intenta usar el mismo link 2 veces
```

**Defensa:**
```typescript
// Primera vez: funciona
if (session.status !== 'pending') {
  return res.status(409).send('Sesión Ya Utilizada');
}

// Después del primer uso:
await sql`UPDATE oauth_sessions SET status = 'completed' ...`;

// Segunda vez: rechazado
```

**Resultado:** ❌ Rechazado - Sesión ya completada

---

### Ataque 4: "Usar un link expirado"

**Ataque:**
```
Usuario guarda el link y lo usa 2 días después
```

**Defensa:**
```typescript
const sessionAge = Date.now() - new Date(session.created_at).getTime();
const MAX_SESSION_AGE = 24 * 60 * 60 * 1000; // 24 horas

if (sessionAge > MAX_SESSION_AGE) {
  return res.status(410).send('Sesión Expirada');
}
```

**Resultado:** ❌ Rechazado - Sesión expirada

---

### Ataque 5: "Inyectar SQL/XSS en el nombre"

**Ataque:**
```bash
curl -X POST /api/connect-mercadopago \
  -d '{"clientName": "<script>alert(1)</script>"}'
```

**Defensa:**
```typescript
// 1. Neon SQL usa prepared statements (previene SQL injection)
await sql`INSERT INTO ... VALUES (${clientName})`;

// 2. Escapamos HTML antes de mostrar
const safeClientName = escapeHtml(session.client_name);
```

**Resultado:** ❌ Bloqueado - Sanitizado

---

## 🔑 Variables de Entorno CRÍTICAS

```env
# 🔴 NUNCA commitear estas variables
# 🔴 NUNCA exponerlas al frontend

# Admin (para endpoints administrativos)
ADMIN_SECRET_KEY=genera_con_openssl_rand_-hex_32

# Mercado Pago
MP_CLIENT_ID=tu_client_id
MP_CLIENT_SECRET=tu_client_secret_SUPER_SECRETO
MP_REDIRECT_URI=https://tu-dominio.vercel.app/api/callback

# Base de Datos
DATABASE_URL=postgresql://...
```

**Generar ADMIN_SECRET_KEY seguro:**

```bash
openssl rand -hex 32
# Resultado: 4f3d2a1b7e9c8f6a5d4e3b2c1a9f8e7d6c5b4a3e2f1d0c9b8a7f6e5d4c3b2a1
```

---

## ✅ Checklist de Implementación

### Para Producción

- [ ] Implementar autenticación de usuarios (NextAuth, Auth0, Clerk, etc.)
- [ ] Usar `/api/connect-mercadopago` con autenticación
- [ ] Configurar `ADMIN_SECRET_KEY` en Vercel
- [ ] Nunca exponer `/api/generate-auth-link` sin adminKey
- [ ] Validar que los UUIDs se generen server-side
- [ ] Configurar CORS si usas frontend separado
- [ ] Habilitar rate limiting en Vercel (Pro plan)
- [ ] Configurar health-check con cron job
- [ ] Revisar logs de intentos no autorizados

### Para Desarrollo

- [ ] Crear `.env.local` con variables de prueba
- [ ] Usar cuenta de Mercado Pago en modo test
- [ ] Probar flujo completo end-to-end
- [ ] Validar expiración de sesiones
- [ ] Probar revocación de tokens

---

## 🎯 Recomendación Final

**Para tu caso de uso (médicos conectando sus cuentas):**

1. **Implementar NextAuth** o similar
2. **Usar la Opción 1** (Server-Side Rendering)
3. **Página protegida:** `/dashboard/connect-mercadopago`
4. **Flujo:**
   ```
   Usuario logueado → Página dashboard → Click "Conectar MP"
   → Link generado server-side → Mercado Pago → Callback → Éxito
   ```

**¿Puede un atacante generar links?**
- ❌ No, porque necesita estar autenticado como usuario válido
- ❌ No, porque los endpoints admin requieren ADMIN_SECRET_KEY
- ❌ No, porque los UUIDs son impredecibles
- ❌ No, porque las sesiones expiran en 24h
- ❌ No, porque cada link solo sirve una vez

---

## 📞 En caso de Incidente

1. Rotar `ADMIN_SECRET_KEY` inmediatamente
2. Ejecutar `/api/health-check` para ver tokens comprometidos
3. Revocar tokens sospechosos con `/api/revoke-access`
4. Si es grave: `npx tsx scripts/emergency-revoke-all.ts`
5. Revisar logs de Vercel para identificar el ataque
6. Notificar a usuarios afectados

---

**Última actualización:** 2025-12-28
