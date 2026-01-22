# Configuración de Cal.com API

## Resumen

e-bio-link se integra con Cal.com mediante **API Keys** proporcionadas por el usuario. Este enfoque es completamente gratuito y le da al usuario control total sobre su calendario.

## Flujo de Integración

### Paso 1: Usuario Crea Cuenta en Cal.com

El usuario debe tener una cuenta gratuita en Cal.com:
- Ir a https://cal.com/signup
- Crear cuenta gratuita (2 minutos)
- Completar perfil básico

### Paso 2: Usuario Genera API Key

1. Iniciar sesión en https://app.cal.com
2. Ir a **Settings → Security**
3. En la sección **API Keys**, hacer clic en **+ New API Key**
4. Darle un nombre (ej: "Mi Biolink")
5. Copiar la API Key (empieza con `cal_live_` o `cal_test_`)

⚠️ **Importante**: La API Key solo se muestra UNA VEZ. Si se pierde, hay que generar una nueva.

### Paso 3: Usuario Pega API Key en Onboarding

En el **Paso 2 del Onboarding**:

1. Usuario pega su API Key en el campo de texto
2. Hace clic en "Validar y Conectar"
3. El sistema:
   - Valida la API Key llamando a `GET /v2/me` de Cal.com
   - Guarda la API Key encriptada en la base de datos
   - Obtiene el username de Cal.com
   - Auto-configura un event type "Consulta" de 30 minutos
   - Marca la conexión como exitosa

## Endpoints Implementados

### POST /api/calcom/validate-key

Valida la API Key del usuario y la guarda en la base de datos.

**Request:**
```json
{
  "apiKey": "cal_live_xxxxxxxxxxxxxxxxxx"
}
```

**Response (éxito):**
```json
{
  "success": true,
  "username": "drjuan",
  "message": "API Key validada y guardada correctamente"
}
```

**Seguridad:**
- Requiere autenticación (cookie `client_session`)
- Valida formato de API Key
- Llama a Cal.com API para verificar validez
- Guarda API Key en `clients.cal_api_key`

---

### POST /api/calcom/setup-calendar

Configura automáticamente el calendario del usuario.

**Request:** No requiere body

**Response:**
```json
{
  "success": true,
  "message": "Calendario configurado correctamente",
  "eventTypeId": 12345
}
```

**Acciones:**
1. Verifica event types existentes
2. Si no existe "Consulta", crea uno:
   - Duración: 30 minutos
   - Título: "Consulta"
   - Slug: "consulta"
3. Guarda `cal_event_type_id` en la base de datos

---

### GET /api/calcom/check-connection

Verifica si el cliente tiene Cal.com conectado.

**Response:**
```json
{
  "connected": true,
  "cal_username": "drjuan"
}
```

---

## Migración de Base de Datos

Ejecutar en Neon Database:

```sql
\i lib/migrations/add-calcom-integration.sql
```

O ejecutar el SQL directamente:

```sql
-- Agregar campos a la tabla clients
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS cal_api_key text,
ADD COLUMN IF NOT EXISTS cal_username varchar(100),
ADD COLUMN IF NOT EXISTS cal_event_type_id integer;

-- Comentarios
COMMENT ON COLUMN clients.cal_api_key IS 'API Key de Cal.com del cliente (encriptada)';
COMMENT ON COLUMN clients.cal_username IS 'Username de Cal.com del cliente';
COMMENT ON COLUMN clients.cal_event_type_id IS 'ID del event type principal en Cal.com';

-- Índice
CREATE INDEX IF NOT EXISTS idx_clients_cal_username ON clients(cal_username);
```

## ¿Qué Podemos Hacer con la API Key?

Con la API Key del usuario tenemos acceso completo a su calendario:

✅ **Gestión de Event Types**
- Crear nuevos tipos de eventos
- Modificar duración
- Configurar disponibilidad
- Establecer redirect URLs

✅ **Gestión de Bookings**
- Crear turnos programáticamente
- Leer turnos existentes
- Modificar turnos
- Cancelar turnos

✅ **Webhooks**
- Configurar notificaciones de nuevos turnos
- Recibir actualizaciones de cambios
- Sincronizar en tiempo real

✅ **Disponibilidad**
- Configurar horarios de trabajo
- Gestionar días disponibles
- Configurar buffers entre turnos

## Ventajas de Este Enfoque

| Feature | API Key (implementado) | OAuth (no viable) | Platform (pago) |
|---------|------------------------|-------------------|-----------------|
| **Costo** | 🟢 GRATIS | 🔴 Requiere aprobación | 🔴 $299-2499/mes |
| **Setup** | 🟢 3 minutos | 🔴 Días/semanas | 🔴 Proceso complejo |
| **Control Usuario** | 🟢 Total | 🟡 Limitado por scopes | 🔴 Ninguno |
| **Escalabilidad** | 🟢 Ilimitada | 🟢 Ilimitada | 🔴 Límite de bookings |
| **Self-service** | 🟢 Sí | 🔴 No | 🔴 No |

## Cal.com API v2 - Endpoints Utilizados

### GET /v2/me

Obtiene información del usuario autenticado.

**Headers:**
```
Authorization: Bearer cal_live_xxxxx
Content-Type: application/json
cal-api-version: 2024-08-13
```

**Response:**
```json
{
  "user": {
    "id": 123,
    "username": "drjuan",
    "email": "juan@example.com",
    "name": "Dr. Juan Pérez"
  }
}
```

---

### GET /v2/event-types

Obtiene todos los event types del usuario.

**Response:**
```json
{
  "data": [
    {
      "id": 456,
      "title": "Consulta",
      "slug": "consulta",
      "lengthInMinutes": 30
    }
  ]
}
```

---

### POST /v2/event-types

Crea un nuevo event type.

**Request:**
```json
{
  "lengthInMinutes": 30,
  "title": "Consulta",
  "description": "Consulta profesional de 30 minutos",
  "slug": "consulta"
}
```

**Response:**
```json
{
  "data": {
    "id": 789,
    "title": "Consulta",
    "slug": "consulta"
  }
}
```

---

## Seguridad

### Almacenamiento de API Key

- ✅ Se guarda en `clients.cal_api_key` (texto)
- ⚠️ **TODO**: Implementar encriptación en reposo (AES-256)
- ✅ Solo accesible por el propio cliente autenticado
- ✅ No se expone en respuestas de API

### Validación

- ✅ Formato validado (debe empezar con `cal_live_` o `cal_test_`)
- ✅ Validez verificada contra Cal.com API antes de guardar
- ✅ Requiere sesión activa de cliente
- ✅ Timeout de 10 segundos en llamadas externas

### Mejores Prácticas

1. **Rotación de Keys**: Permitir al usuario regenerar su API Key
2. **Logs de Auditoría**: Registrar cuándo se usa la API Key
3. **Rate Limiting**: Implementar límites de uso (Cal.com: 120 req/min)
4. **Error Handling**: Manejar keys expiradas o revocadas

---

## Troubleshooting

### Error: "API Key inválida o expirada"

- Verificar que la API Key sea correcta
- Verificar que empiece con `cal_live_` o `cal_test_`
- Regenerar API Key en Cal.com si es necesario

### Error: "No autorizado"

- Verificar que el cliente esté autenticado
- Verificar que la cookie `client_session` sea válida
- Verificar que el cliente tenga status='active'

### Warning: "No se pudo crear event type"

- No es crítico, el sistema continúa
- Verificar permisos de la API Key
- Verificar que no exista ya un event type con ese nombre

---

## Testing Local

1. Crear cuenta en Cal.com (gratis)
2. Generar API Key en https://app.cal.com/settings/security
3. Ejecutar migración en base de datos local
4. Iniciar servidor: `npm run dev`
5. Ir a `http://localhost:3000/onboarding`
6. Pegar API Key en el Paso 2

---

## Referencias

- [Cal.com API v2 Documentation](https://cal.com/docs/api-reference/v2/introduction)
- [Cal.com Authentication](https://cal.com/docs/api-reference/v1/authentication)
- [Where is My API Key?](https://cal.com/blog/where-is-my-api-key-and-what-can-it-do)
- [Cal.com API Essentials](https://rollout.com/integration-guides/cal.com/api-essentials)

---

## Próximos Pasos

### Fase 1: ✅ Completado
- Validación y guardado de API Key
- Auto-configuración de event type
- Check de conexión

### Fase 2: Pendiente
- Mostrar booking link en biolink del cliente
- Webhook para recibir notificaciones de turnos
- Dashboard de turnos en admin panel

### Fase 3: Futuro
- Sincronización bidireccional de disponibilidad
- Integración con Google Calendar vía Cal.com
- Recordatorios automáticos por WhatsApp
