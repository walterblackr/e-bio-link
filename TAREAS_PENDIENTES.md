# Tareas Pendientes - e-bio-link

## Fecha: 05 de Enero 2026

---

## 1. Flujo de Onboarding Completo

### ✅ Completado
- OAuth de Mercado Pago con auto-configuración de webhooks
- Creación automática de usuario en BD
- Generación de slug único basado en nombre

### 🔨 Por Implementar

#### A. Página de Alta/Configuración de Perfil
**Ubicación:** `/app/(admin)/admin/configurar-perfil/page.tsx`

**Funcionalidad:**
1. Formulario para completar datos:
   - ✅ Nombre completo (ya existe)
   - ✅ Especialidad
   - ✅ Matrícula
   - ✅ Descripción
   - 🆕 **Foto de perfil** (PRIORIDAD)
   - 🆕 **Cal.com API Key**
   - 🆕 **Cal.com Username**
   - 🆕 Precio de consulta (monto_consulta)
   - 🆕 Configuración de botones (botones_config)
   - 🆕 Tema/colores (tema_config)

2. **CRÍTICO: Sin Cal.com configurado, NO se puede activar el botón de pago**
   - Agregar validación: `cal_api_key` y `cal_username` requeridos para habilitar pagos
   - Mostrar mensaje claro: "Configurá tu Cal.com para habilitar reservas con pago"

#### B. Gestión de Foto de Perfil

**Especificaciones Técnicas:**
- **Formato:** JPG, PNG, WebP
- **Tamaño recomendado:** 800x800px (cuadrado)
- **Peso máximo:** 2MB
- **Aspect Ratio:** 1:1 (cuadrado, se recortará si es necesario)

**Opciones de Almacenamiento:**
1. **Vercel Blob Storage** (recomendado)
   - Fácil integración con Next.js
   - CDN incluido
   - Costo: ~$0.15/GB almacenamiento + $0.20/GB transferencia

2. **Cloudinary** (alternativa)
   - Free tier: 25GB almacenamiento
   - Transformaciones automáticas
   - CDN global

**Ubicación en el Flujo:**
- Campo obligatorio en formulario de alta
- Editable desde panel de administración
- Preview en tiempo real antes de guardar

**Implementación:**
```typescript
// Componente de upload
<input
  type="file"
  accept="image/jpeg,image/png,image/webp"
  onChange={handleImageUpload}
/>

// Validación cliente
- Verificar dimensiones mínimas: 400x400px
- Verificar peso máximo: 2MB
- Preview con crop circular
```

---

## 2. Encriptar Datos de Cal.com

### 🔒 Campos a Encriptar
Actualmente solo encriptamos `mp_access_token` y `mp_refresh_token`.

**Agregar encriptación para:**
- `cal_api_key` (PRIORIDAD ALTA)
- `cal_username` (opcional, pero recomendado)

### Implementación
**Archivo:** `lib/encryption.ts` (ya existe)

**Modificar en:**
1. `/pages/api/[ruta-de-guardado-cal-config].ts`
   ```typescript
   import { encrypt } from '@/lib/encryption';

   const encryptedApiKey = encrypt(cal_api_key);

   await sql`
     UPDATE clients
     SET cal_api_key = ${encryptedApiKey}
     WHERE slug = ${slug}
   `;
   ```

2. Actualizar lectura en:
   - `/pages/api/crear-preferencia-pago.ts` ✅ (ya usa decrypt para MP)
   - `/pages/api/webhooks/mercadopago.ts` ✅ (ya usa decrypt para MP)
   - Agregar decrypt para `cal_api_key` en ambos archivos

---

## 3. Open Graph (OG) Images para WhatsApp

### ✅ Completado
- ✅ Instalado `@vercel/og`
- ✅ Creado `/lib/get-profile.ts`
- ✅ Creado `/app/(producto)/biolink/[slug]/opengraph-image.tsx`

### 🔨 Por Hacer

#### A. Agregar Metadatos Dinámicos
**Archivo:** `/app/(producto)/biolink/[slug]/page.tsx`

Agregar función `generateMetadata`:
```typescript
import { Metadata } from 'next';
import { getProfileBySlug } from '@/lib/get-profile';

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const perfil = await getProfileBySlug(params.slug);

  if (!perfil) {
    return { title: 'Perfil no encontrado' };
  }

  return {
    title: `Reserva con ${perfil.nombre_completo} | e-bio-link`,
    description: `Agenda tu turno online con ${perfil.nombre_completo}${perfil.especialidad ? ` (${perfil.especialidad})` : ''}. Rápido, seguro y sin esperas.`,
    openGraph: {
      title: `📅 Turnos Online: ${perfil.nombre_completo}`,
      description: `Reserva tu cita con ${perfil.nombre_completo} en segundos.`,
      images: [
        {
          url: `/biolink/${params.slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${perfil.nombre_completo} - ${perfil.especialidad}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Turnos con ${perfil.nombre_completo}`,
      description: `Reserva online con ${perfil.nombre_completo}`,
    },
  };
}
```

#### B. Probar en WhatsApp
1. Subir cambios a producción
2. Enviar link de biolink por WhatsApp
3. Verificar que se vea la imagen de preview

---

## 4. Limpieza de Código

### 🧹 Eliminar Console.logs

**Archivos a limpiar:**
- ✅ `/pages/api/webhooks/mercadopago.ts` (HECHO)
- ✅ `/pages/api/callback.ts` (HECHO)
- ⚠️ Revisar todos los demás archivos en `/pages/api/**/*.ts`
- ⚠️ Revisar componentes en `/app/**/*.tsx`

**Comando para encontrar todos los console.log:**
```bash
grep -r "console.log" --include="*.ts" --include="*.tsx" app/ pages/
```

**Excepción:** Mantener `console.error` para errores críticos.

---

## 5. Mejoras Cal.com API v2

### ✅ Completado Hoy
- ✅ Cambio de v1 a v2 para confirmar bookings: `POST /v2/bookings/{uid}/confirm`
- ✅ Cambio de v1 a v2 para cancelar bookings: `POST /v2/bookings/{uid}/cancel`
- ✅ Fix: Usar headers Authorization en vez de query params

### 📝 Pendiente de Testing
- Probar flujo completo de pago → confirmación en Cal.com
- Verificar que el email de Cal.com se envía al paciente

---

## 6. Configuración de Producción

### 🔐 Variables de Entorno a Revisar

**Vercel Environment Variables:**
- ✅ `DATABASE_URL` (Neon)
- ✅ `ENCRYPTION_KEY`
- ✅ `MP_CLIENT_ID`
- ✅ `MP_CLIENT_SECRET`
- ✅ `MP_REDIRECT_URI`
- ✅ `NEXT_PUBLIC_APP_URL`
- ⚠️ `MERCADOPAGO_WEBHOOK_SECRET` (opcional, actualmente en warning mode)

---

## 7. Testing End-to-End

### 🧪 Flujo Completo a Probar

1. **Onboarding Médico:**
   - [ ] Autorizar Mercado Pago → Usuario creado
   - [ ] Configurar perfil completo (con foto y Cal.com)
   - [ ] Verificar biolink generado

2. **Reserva de Paciente:**
   - [ ] Paciente entra al biolink
   - [ ] Selecciona turno en Cal.com
   - [ ] Paga con Mercado Pago
   - [ ] Webhook confirma en Cal.com
   - [ ] Paciente recibe email de Cal.com
   - [ ] Médico ve el turno confirmado

3. **Compartir en WhatsApp:**
   - [ ] Copiar link del biolink
   - [ ] Enviar por WhatsApp
   - [ ] Verificar preview con imagen OG

---

## Prioridades para Mañana

### 🔥 Alta Prioridad
1. **Foto de perfil:** Definir storage y crear componente de upload
2. **Encriptar cal_api_key:** Modificar guardado y lectura
3. **Agregar generateMetadata:** Para que funcione OG en WhatsApp
4. **Página de configuración de perfil:** Formulario completo de alta

### ⚡ Media Prioridad
5. Limpieza de console.log en toda la app
6. Testing end-to-end del flujo completo

### 📌 Baja Prioridad
7. Documentación de setup para nuevos desarrolladores
8. Configurar MERCADOPAGO_WEBHOOK_SECRET en producción

---

## Notas Técnicas

### Estructura de BD - Tabla `clients`
```sql
- slug (text, unique) ✅
- nombre_completo (text) ✅
- especialidad (text) ⚠️ (editable)
- matricula (text) ⚠️ (editable)
- descripcion (text) ⚠️ (editable)
- foto_url (text) 🆕 (a implementar)
- mp_access_token (text, encrypted) ✅
- mp_refresh_token (text, encrypted) ✅
- mp_user_id (text) ✅
- cal_api_key (text) 🔒 (a encriptar)
- cal_username (text) 🔒 (a encriptar)
- monto_consulta (numeric) ⚠️ (editable)
- botones_config (jsonb) ⚠️ (editable)
- tema_config (jsonb) ⚠️ (editable)
```

### Dependencias Instaladas
- ✅ `@vercel/og` - Para OG images
- ✅ `@neondatabase/serverless` - BD
- ✅ `axios` - HTTP requests
- ✅ Crypto (Node.js built-in) - Encriptación

---

## Referencias

- [Cal.com API v2 - Confirm Booking](https://cal.com/docs/api-reference/v2/bookings/confirm-booking-that-requires-a-confirmation)
- [Cal.com API v2 - Cancel Booking](https://cal.com/docs/api-reference/v2/bookings/cancel-a-booking)
- [Next.js OG Image Generation](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image)
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob)
