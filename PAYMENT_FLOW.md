# Flujo Completo de Pagos - e-bio-link

## 📋 Resumen

Este documento explica el flujo completo de cómo un paciente reserva un turno con un médico y realiza el pago a través de Mercado Pago.

## 🎯 Objetivo

Permitir que cuando un paciente reserve un turno en Cal.com, sea redirigido a una página de confirmación donde puede ver el resumen y pagar. Una vez pagado, el turno se confirma automáticamente en Cal.com.

## 🔄 Flujo Paso a Paso

### 1. Usuario visita el biolink del médico

```
URL: https://e-bio-link.vercel.app/biolink/dra-valeria
```

- Se muestra el perfil del médico
- Aparece botón "Agendar Turno" (Cal.com embed)

### 2. Usuario hace clic en "Agendar Turno"

- Se abre el modal/página de Cal.com
- Usuario completa:
  - Nombre
  - Email
  - Teléfono (opcional)
  - Fecha y hora deseada

### 3. Usuario confirma la reserva en Cal.com

**Cal.com crea un booking en estado PENDING**

Luego **redirige automáticamente** a:
```
https://e-bio-link.vercel.app/pagar?uid=XXX&attendeeName=XXX&email=XXX&startTime=XXX&clientSlug=dra-valeria
```

### 4. Página de confirmación de pago

**Archivo:** `app/pagar/page.tsx`

**La página:**
1. Lee los parámetros de la URL (datos del turno)
2. Consulta el precio de consulta del médico
3. Muestra un resumen:
   - Nombre del paciente
   - Email
   - Fecha y hora del turno
   - Precio total
4. Botón "Pagar con Mercado Pago"

### 5. Usuario hace clic en "Pagar con Mercado Pago"

**API llamada:** `POST /api/crear-preferencia-pago`

**Acciones:**
1. Busca al médico por `client_slug`
2. Desencripta el `mp_access_token` del médico
3. Crea el registro en la tabla `bookings` con estado `pending`
4. Crea preferencia en Mercado Pago usando el token del médico
5. Guarda el `mp_preference_id` en el booking
6. **Retorna `init_point`** (URL del checkout de Mercado Pago)

### 6. Redirección al checkout de Mercado Pago

- El navegador redirige al `init_point`
- El pago va **directamente a la cuenta del médico** (porque usamos su token)
- Usuario completa el pago

### 7. Mercado Pago procesa el pago

Una vez aprobado, Mercado Pago:
1. Redirige al usuario a `/pago-exitoso`
2. Envía webhook a `/api/webhooks/mercadopago`

### 8. Webhook de Mercado Pago

**Archivo:** `pages/api/webhooks/mercadopago.ts`

**Acciones si pago approved:**
1. Busca bookings pendientes con MP configurado
2. Intenta obtener detalles del pago con cada token
3. Matchea el pago con el booking por `preference_id`
4. Actualiza booking a estado `paid`
5. **Confirma el turno en Cal.com** (status: ACCEPTED) usando `cal_api_key`
6. Actualiza booking a estado `confirmed`

### 9. Cal.com envía confirmación

Una vez que el turno pasa a estado `ACCEPTED`, Cal.com automáticamente envía:

**Email al paciente:**
- Confirmación del turno
- Link de videollamada (Google Meet, Zoom, etc.)
- Detalles completos (fecha, hora, médico)
- Opción para cancelar/reagendar

**Email al médico:**
- Nueva reserva confirmada
- Datos del paciente

### 10. Usuario ve página de éxito

**Archivo:** `app/pago-exitoso/page.tsx`

Muestra mensaje de éxito con:
- Confirmación de pago
- ID de pago
- Aviso de que recibirá email con link de reunión

## 🗄️ Base de Datos

### Tabla: `bookings`

```sql
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  client_slug VARCHAR(255) NOT NULL,        -- Referencia al médico
  cal_booking_id VARCHAR(255) UNIQUE,       -- ID de Cal.com
  cal_event_type_id VARCHAR(255),

  -- Paciente
  paciente_nombre VARCHAR(255) NOT NULL,
  paciente_email VARCHAR(255) NOT NULL,
  paciente_telefono VARCHAR(50),

  -- Turno
  fecha_hora TIMESTAMP NOT NULL,
  duracion_minutos INTEGER DEFAULT 30,

  -- Mercado Pago
  mp_preference_id VARCHAR(255),             -- ID de preferencia de MP
  mp_payment_id VARCHAR(255),                -- ID del pago en MP
  mp_payment_status VARCHAR(50) DEFAULT 'pending',

  -- Pago
  monto DECIMAL(10, 2),                      -- Monto en ARS
  estado VARCHAR(50) DEFAULT 'pending',      -- pending, paid, confirmed, cancelled

  -- Metadata
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP,                         -- Cuando se pagó
  confirmed_at TIMESTAMP                     -- Cuando se confirmó en Cal.com
);
```

**Estados posibles:**
- `pending` - Booking creado, esperando pago
- `paid` - Pago confirmado
- `confirmed` - Turno confirmado en Cal.com
- `cancelled` - Pago rechazado o turno cancelado

## 🔧 Configuración

### 1. Cal.com - Success Redirect URL

En la configuración del Event Type de Cal.com, configurar:

```
Success Redirect URL:
https://e-bio-link.vercel.app/pagar?uid={BOOKING_UID}&attendeeName={ATTENDEE_NAME}&email={ATTENDEE_EMAIL}&startTime={START_TIME}&clientSlug=dra-valeria
```

**Variables disponibles:**
- `{BOOKING_UID}` - ID único del booking
- `{ATTENDEE_NAME}` - Nombre del paciente
- `{ATTENDEE_EMAIL}` - Email del paciente
- `{START_TIME}` - Fecha/hora inicio (ISO 8601)
- `clientSlug` - Hardcodeado para cada médico

### 2. Mercado Pago - Webhook

En la aplicación de Mercado Pago, configurar webhook:

```
URL: https://e-bio-link.vercel.app/api/webhooks/mercadopago
Eventos: payments
```

### 3. Variables de entorno

```env
# Base de datos
DATABASE_URL=postgresql://...

# URL de la app
NEXT_PUBLIC_APP_URL=https://e-bio-link.vercel.app

# Mercado Pago OAuth
MERCADOPAGO_CLIENT_ID=...
MERCADOPAGO_CLIENT_SECRET=...
MERCADOPAGO_REDIRECT_URI=https://e-bio-link.vercel.app/api/callback

# Encriptación
ENCRYPTION_KEY=... (32 bytes en base64)

# Admin
ADMIN_SESSION_SECRET=...
```

## 🧪 Testing

### Probar el flujo completo:

1. **Crear médico en admin:**
   - Ir a `/admin/clientes`
   - Crear cliente con todos los datos
   - Configurar `monto_consulta` (ej: 10000)

2. **Conectar Mercado Pago:**
   - Ir a `/admin/generate-links`
   - Generar link OAuth para el cliente
   - Completar OAuth flow

3. **Configurar Cal.com:**
   - Crear cuenta en Cal.com
   - Configurar Event Type
   - Agregar Success Redirect URL con el slug del médico
   - Copiar API key
   - Guardar `cal_api_key` en la BD del cliente

4. **Probar reserva:**
   - Ir al biolink del médico
   - Hacer clic en "Agendar Turno"
   - Completar formulario de Cal.com
   - Confirmar
   - Deberías ser redirigido a `/pagar`

5. **Probar pago:**
   - Verificar que se muestre el resumen correcto
   - Hacer clic en "Pagar con Mercado Pago"
   - Completar pago en Mercado Pago
   - Verificar redirección a `/pago-exitoso`

6. **Verificar confirmación:**
   - Revisar que el webhook de MP haya sido llamado
   - Verificar en BD que el estado sea `confirmed`
   - Verificar que Cal.com envió el email de confirmación

## 📊 Monitoreo

### Consultas útiles:

```sql
-- Ver todos los bookings
SELECT * FROM bookings ORDER BY created_at DESC;

-- Ver bookings pendientes de pago
SELECT * FROM bookings WHERE estado = 'pending';

-- Ver bookings pagados pero no confirmados
SELECT * FROM bookings WHERE estado = 'paid';

-- Ver bookings confirmados hoy
SELECT * FROM bookings
WHERE estado = 'confirmed'
AND DATE(confirmed_at) = CURRENT_DATE;

-- Ver total recaudado por médico
SELECT
  client_slug,
  COUNT(*) as total_turnos,
  SUM(monto) as total_recaudado
FROM bookings
WHERE estado = 'confirmed'
GROUP BY client_slug;
```

## ⚠️ Notas Importantes

1. **Pago directo al médico:** El dinero va directamente a la cuenta de Mercado Pago del médico, no pasa por la plataforma.

2. **Cal.com maneja emails:** No enviamos emails nosotros, Cal.com se encarga cuando el turno pasa a ACCEPTED.

3. **Webhook debe estar configurado:** Mercado Pago debe estar configurado para enviar webhooks a nuestra URL.

4. **Cal.com API key necesaria:** Para confirmar turnos automáticamente, cada médico necesita su Cal.com API key en la BD.

5. **clientSlug en URL:** La URL de redirección de Cal.com debe incluir el slug del médico para saber a quién pertenece el booking.

## 🔐 Seguridad

- Los tokens de Mercado Pago se almacenan **encriptados** con AES-256-GCM
- Solo se desencriptan en el momento de hacer la llamada a la API
- Los webhooks siempre retornan 200 para evitar reintentos infinitos
- Las APIs validan todos los campos requeridos
- Los precios se toman de la BD, no del frontend
