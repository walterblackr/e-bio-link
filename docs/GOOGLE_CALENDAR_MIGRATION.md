# Plan: Migración de Cal.com a Google Calendar API

## Estado: EN EJECUCIÓN

| Fase | Descripción | Estado |
|------|-------------|--------|
| 1 | Base de Datos + Google OAuth | COMPLETADA |
| 2 | Disponibilidad + Eventos sin Cal.com + Onboarding | Pendiente |
| 3 | UI de Reserva (SlotPicker + BookingFlow) | Pendiente |
| 4 | Pagos (Transferencia + Comprobante + Confirmación) | Pendiente |
| 5 | Emails con Resend | Pendiente |
| 6 | Limpieza (eliminar Cal.com, actualizar docs) | Pendiente |

---

## Contexto

El SaaS e-bio-link usaba Cal.com para gestionar turnos, pero:

1. **Onboarding con fricción**: El profesional debía salir de la plataforma, crear cuenta en Cal.com, generar API key y volver.
2. **Costo**: Cal.com Platform cobra $99-299/mes. La versión self-hosted gratuita no expone API funcional.
3. **Comisiones**: Los profesionales pierden 6% por comisión de Mercado Pago en cada turno.

**Solución**: Reemplazar Cal.com con Google Calendar API (gratis, 1M requests/día) y permitir pagos por transferencia bancaria (0% comisión).

---

## Arquitectura Nueva

```
Vercel (Tu SaaS)
├─ Next.js 15 App Router
├─ API Routes (Pages Router)
├─ Google Calendar API (directo, sin SDK)
└─ Resend (emails)

Neon Postgres
├─ clients (+ google_access_token, google_refresh_token, payment_method, cbu_alias)
├─ eventos (+ modalidad: virtual/presencial)
├─ bookings (+ google_event_id, meet_link, comprobante_url)
└─ disponibilidad (nueva tabla: horarios por día)

Costo total: $0/mes (Vercel free + Neon free + Google Calendar API free + Resend free)
```

### Onboarding (5 pasos)
```
Step 1: Identidad (foto, nombre, especialidad, colores)
Step 2: Conectar Google Calendar (OAuth, UN CLICK)
Step 3: Configurar disponibilidad (días/horas)
Step 4: Crear tipos de evento (virtual/presencial)
Step 5: Configurar método de pago (MP o transferencia)
```

### Reserva de Turno (paciente)
```
/biolink/[slug] → /reserva/[slug] → Seleccionar evento → Ver slots → Formulario → Pago → Confirmación
```

---

## Fase 1: Base de Datos + Google OAuth (COMPLETADA)

### Migraciones ejecutadas en Neon

1. `lib/migrations/add-google-calendar-fields.sql` — Tokens OAuth de Google en clients
2. `lib/migrations/add-payment-method-fields.sql` — CBU/Alias/banco en clients
3. `lib/migrations/create-disponibilidad-table.sql` — Tabla de horarios por día
4. `lib/migrations/update-eventos-for-google.sql` — Campo modalidad en eventos
5. `lib/migrations/update-bookings-for-google.sql` — Google event ID, Meet link, comprobante en bookings

### Archivos creados

- `lib/google-calendar.ts` — Librería utilitaria (token refresh, FreeBusy, crear/eliminar eventos con Meet)
- `pages/api/google/auth-url.ts` — Genera URL de consentimiento OAuth2
- `pages/api/google/callback.ts` — Recibe callback de Google, guarda tokens encriptados
- `pages/api/google/check-connection.ts` — Verifica si Google Calendar está conectado

### Variables de entorno configuradas en Vercel

```
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REDIRECT_URI=https://e-bio-link.vercel.app/api/google/callback
```

### Google Cloud Console

- Proyecto creado con Google Calendar API habilitada
- OAuth consent screen configurada (External, modo prueba)
- Credenciales OAuth2 creadas (Web application)
- Redirect URI: `https://e-bio-link.vercel.app/api/google/callback`

---

## Fase 2: Disponibilidad + Eventos sin Cal.com

### Nuevo endpoint
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `pages/api/disponibilidad/index.ts` | GET/POST | CRUD de horarios por día de semana |

### Modificar endpoints existentes

**`pages/api/eventos/index.ts`** — Simplificar:
- Eliminar llamada a Cal.com API
- Solo INSERT/SELECT en tabla eventos local + campo modalidad

**`pages/api/eventos/[id].ts`** — Simplificar:
- Eliminar llamadas a Cal.com PATCH/DELETE
- Solo operar sobre tabla eventos local

### Nuevos componentes de onboarding

- `wizard-step2-google.tsx` — Reemplaza wizard-step2.tsx (OAuth Google, un click)
- `wizard-step3-availability.tsx` — Grilla de 7 días con toggle y horarios
- `wizard-step2b.tsx` — Modificar: agregar modalidad, eliminar Cal.com sync
- `OnboardingWizard.tsx` — Modificar: 3 pasos → 5 pasos

---

## Fase 3: UI de Reserva (lo que ve el paciente)

### Nuevos endpoints públicos (sin auth)
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `pages/api/slots/[slug].ts` | GET | Slots disponibles (FreeBusy API) |
| `pages/api/reservar.ts` | POST | Crear booking |

### Nuevas páginas
- `app/reserva/[slug]/page.tsx` — Server Component
- `app/reserva/[slug]/BookingFlow.tsx` — Flujo completo de reserva
- `app/components/SlotPicker.tsx` — Calendario + selector de horarios

### Modificar
- `app/components/BioLinkTemplate.tsx` — Eliminar embed Cal.com, link a /reserva/[slug]
- `app/(producto)/biolink/[slug]/page.tsx` — Eliminar cal_username

---

## Fase 4: Pagos + Confirmación

### Nuevos archivos
- `wizard-step5-payment.tsx` — Selector MP/Transferencia en onboarding
- `app/components/TransferPayment.tsx` — UI de datos bancarios + upload comprobante
- `pages/api/upload-comprobante.ts` — Sube comprobante a Cloudinary
- `pages/api/confirmar-turno.ts` — Profesional confirma → crea evento Google Calendar

### Modificar
- `pages/api/webhooks/mercadopago.ts` — Reemplazar Cal.com confirm con Google Calendar createEvent
- `pages/api/crear-preferencia-pago.ts` — Usar booking_id interno
- `app/pagar/page.tsx` — Eliminar params de Cal.com, agregar opción transferencia

---

## Fase 5: Emails con Resend

- Instalar `resend`
- Crear `lib/email.ts` con templates: confirmación, notificación al médico, cancelación
- Integrar en webhook MP y confirmar-turno

---

## Fase 6: Limpieza

### Eliminar
- `pages/api/calcom/` (3 archivos)
- `app/(auth)/onboarding/wizard-step2.tsx` (reemplazado)
- Dependencia `@calcom/embed-react`

### Deprecar (mantener columnas, dejar de escribir)
- `clients.cal_api_key`, `clients.cal_username`, `clients.cal_event_type_id`
- `eventos.cal_event_type_id`, `eventos.cal_slug`
- `bookings.cal_booking_id`

### Actualizar
- `CLAUDE.md` — Documentar nueva arquitectura

---

## Manejo de Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| Token Google expirado | `getValidAccessToken()` refresca automáticamente |
| Dos pacientes reservan mismo slot | Re-verificar FreeBusy antes de confirmar + hold de 15min |
| Comprobante falso | Profesional valida manualmente |
| Clientes existentes con Cal.com | Backward compat: si tiene cal_api_key, mantener embed |
| Meet link no generado | Fallback a conferenceData.entryPoints |
| Timezone | Siempre usar America/Argentina/Buenos_Aires |

---

## Dependencias npm

- **Agregar**: `resend`
- **Eliminar**: `@calcom/embed-react`
- **Reutilizar**: `axios` para Google Calendar API (sin instalar googleapis)
