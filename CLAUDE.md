# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**e-bio-link** is a SaaS platform for healthcare professionals to manage appointments and payments. It provides:
- Professional biolink pages (ebiolink.com/slug) with custom color themes and social links
- Google Calendar integration for appointment scheduling and Google Meet creation
- Mercado Pago integration for consultation payments (online + manual transfer)
- Multi-step onboarding wizard for new clients (4 steps)
- Booking management panel for professionals

## Development Commands

```bash
# Development
npm run dev          # Start dev server on http://localhost:3000

# Build & Deploy
npm run build        # Production build
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
```

## Architecture

### Routing Structure

Next.js 15 App Router with route groups:

- **`(marketing)/`** - Public landing pages, pricing, biolinks
- **`(auth)/`** - Protected routes: onboarding, registration, panel
- **`(admin)/`** - Admin panel (requires admin_session cookie)
- **`(producto)/`** - Product-related pages
- **`pages/api/`** - API routes (Next.js Pages Router for API only)

**Middleware** (`middleware.ts`) protects:
- `/admin/*` → requires `admin_session` cookie
- `/onboarding/*` and `/panel/*` → requires `client_session` cookie

### Authentication System

**Two separate auth systems:**

1. **Admin Authentication** (`lib/auth/admin-auth.ts`)
   - Cookie: `admin_session` (JSON: {id, email, nombre})
   - maxAge: 7 days
   - Protected routes: `/admin/*`

2. **Client Authentication** (`lib/auth/client-auth.ts`)
   - Cookie: `client_session` (JSON: {id, email, slug, nombre_completo, status})
   - maxAge: 30 days
   - Protected routes: `/onboarding/*`, `/panel/*`
   - Status: `'pending'` (awaiting payment) or `'active'` (paid)

Both systems expose App Router helpers (`requireClient()`, `requireAdmin()`) and Pages Router helpers (`requireClientFromRequest()`, `requireAdminFromRequest()`).

### Database (Neon Serverless PostgreSQL)

**Key Tables:**

| Table | Description |
|-------|-------------|
| `admins` | Admin users with bcrypt passwords |
| `clients` | Healthcare professionals (UUID primary keys) |
| `eventos` | Consultation types per professional |
| `disponibilidad` | Availability blocks per event type |
| `bookings` | Appointment reservations |

**`clients` Table Key Fields:**
```sql
-- Identity
slug                 -- Unique biolink URL identifier (e.g., 'dr-juan-perez')
nombre_completo, especialidad, matricula, descripcion, foto_url
status               -- 'pending' | 'active'
tema_config          -- JSONB: {background, text, buttonBorder, separator}
botones_config       -- JSONB: array of social links

-- Google Calendar (active integration)
google_access_token  -- Encrypted OAuth access token
google_refresh_token -- Encrypted OAuth refresh token
google_email         -- Associated Google account email
google_calendar_id   -- Target calendar ('primary' or custom)
google_token_expiry  -- Token expiration timestamp

-- Mercado Pago OAuth (for collecting payments)
mp_access_token, mp_refresh_token, mp_user_id

-- Payment method configuration
payment_method       -- 'transfer' | 'mercadopago'
cbu_alias, banco_nombre, titular_cuenta  -- For transfer payments

-- Legacy Cal.com (deprecated, do not use)
cal_managed_user_id, cal_access_token, cal_schedule_id
```

**`eventos` Table (Consultation Types):**
```sql
id (UUID), client_id (UUID FK)
nombre, descripcion
duracion_minutos     -- 15 | 20 | 30 | 45 | 60 | 90
precio               -- ARS cents
modalidad            -- 'virtual' (Google Meet) | 'presencial'
activo
buffer_despues       -- Break minutes after appointment
antelacion_minima    -- Min lead time in minutes
max_por_dia          -- Max bookings per day (NULL = unlimited)
```

**`disponibilidad` Table (Availability Blocks):**
```sql
id, client_id (UUID FK), evento_id (UUID FK)
dia_semana           -- 0=Sun ... 6=Sat
hora_inicio, hora_fin -- TIME (HH:MM)
activo
-- Multiple blocks per day per event are allowed
```

**`bookings` Table:**
```sql
id, client_id (UUID FK), evento_id (UUID FK)
paciente_nombre, paciente_email, paciente_telefono
fecha_hora           -- ISO timestamp of appointment
monto                -- Price in ARS
estado               -- 'pending_payment' | 'pending_confirmation' | 'confirmed' | 'cancelled'
payment_method       -- 'transfer' | 'mercadopago'
comprobante_url      -- Cloudinary URL for transfer proof
google_event_id      -- Created GCal event ID (after confirmation)
meet_link            -- Google Meet URL (if virtual)
notas                -- Optional patient notes
```

**Migrations:** Located in `lib/migrations/` — run manually via Neon console.

### Google Calendar Integration

**Library:** `lib/google-calendar.ts` — uses `axios` (not the googleapis package, which is too large for serverless).

**Key functions:**
- `getValidAccessToken(clientId)` — returns valid token, auto-refreshes if near expiry
- `createEventForClient(clientId, eventData)` — full flow: get token → create event
- `deleteEventForClient(clientId, googleEventId)` — full flow: get token → delete event
- `getFreeBusy(accessToken, calendarId, timeMin, timeMax)` — query busy slots

**OAuth flow:**
1. `GET /api/google/auth-url` → returns Google consent URL (requires client session)
2. Google redirects to `GET /api/google/callback` → stores encrypted tokens → redirects to `/onboarding?google=connected`
3. `GET /api/google/check-connection` → `{connected, google_email}`

**Token storage:** Encrypted with `lib/encryption.ts` before saving to DB.

**Scopes:** `calendar.events`, `calendar.readonly`, `userinfo.email`

**Timezone:** `America/Argentina/Buenos_Aires`

### Onboarding Wizard

**4-Step Process** (`app/(auth)/onboarding/`):

| Step | Component | Purpose |
|------|-----------|---------|
| 1 | `wizard-step1.tsx` | **Identity** — photo, name, specialty, license, bio, 6 color palettes, social links. Real-time preview with `BioLinkPreview`. Saves to `/api/onboarding/step1`. |
| 2 | `wizard-step2-google.tsx` | **Google Calendar** — OAuth flow. Cannot advance until connected. |
| 3 | `wizard-step2b.tsx` | **Consultation Types** — create event types with price, duration, modality, availability blocks per day, advanced settings (buffer, lead time, max/day). Cannot advance until ≥1 event created. |
| 4 | `wizard-step5-payment.tsx` | **Payment Setup** — Mercado Pago OAuth or manual transfer details (CBU/alias). |

**Notes:**
- URL param `?step=X` allows jumping between steps
- URL param `?google=connected` triggers Google connection check after OAuth redirect
- URL param `?from=panel` shows "back to panel" button instead of progress bar

### Payment Flows

#### Platform Subscription (Mercado Pago)
1. User selects plan on `/propuesta` → currently redirects to WhatsApp (onboarding flow not yet launched)
2. Future: redirects to `/register?plan=X`
3. `POST /api/register` creates client with status=`'pending'`
4. `POST /api/crear-preferencia-pago` creates MP preference → `init_point`
5. User pays on Mercado Pago
6. `POST /api/webhooks/mercadopago` validates HMAC signature → updates status=`'active'` → sets `client_session`
7. Redirects to `/onboarding`

#### Appointment Booking (Patient)
1. Patient visits `/{slug}` → sees consultation types and available slots
2. Patient selects slot, enters data → `POST /api/reservar` → booking `estado='pending_payment'`
3. Patient uploads transfer proof → `POST /api/upload-comprobante` → `estado='pending_confirmation'`
4. Email sent to professional with confirm/reject magic links

#### Booking Confirmation (Professional)
1. Professional clicks magic link or uses panel button → `POST /api/confirmar-turno`
2. If `action='confirm'`:
   - Creates Google Calendar event (with Google Meet if virtual)
   - Stores `google_event_id` and `meet_link` in booking
   - Sends confirmation email to patient with meet link
   - `estado='confirmed'`
3. If `action='reject'`:
   - `estado='cancelled'`
   - Sends cancellation email to patient

### Image Upload (Cloudinary)

**Two endpoints:**
- `/api/upload-profile-photo` — For admins (requires `admin_session`)
- `/api/upload-client-photo` — For clients (requires `client_session`)

**Configuration:**
- Folders: `e-bio-link/client-profiles` or `e-bio-link/profiles`
- Transformations: 500×500 crop, face gravity, auto quality/format
- Comprobantes folder: `e-bio-link/comprobantes` (resource_type: 'auto', supports PDF up to 10MB)

### Environment Variables

Required in Vercel:

```env
# Database
DATABASE_URL=postgresql://...

# Google Calendar OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://your-domain.com/api/google/callback

# Mercado Pago OAuth (for professionals to receive payments)
MP_CLIENT_ID=
MP_CLIENT_SECRET=
MP_REDIRECT_URI=https://your-domain.com/api/callback

# Mercado Pago (for platform subscription payments)
MP_ACCESS_TOKEN=

# Admin
ADMIN_SECRET_KEY=   # Generate with: openssl rand -hex 32

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# App URL (used for magic links and redirects)
NEXT_PUBLIC_APP_URL=https://ebiolink.com
```

## Key Patterns

### API Route Authentication

```typescript
// Admin routes (App Router)
import { requireAdmin } from '@/lib/auth/admin-auth';
const admin = await requireAdmin();

// Client routes (App Router)
import { requireActiveClient } from '@/lib/auth/client-auth';
const client = await requireActiveClient();

// Pages Router (API routes)
import { requireActiveClientFromRequest } from '@/lib/auth/client-auth';
const client = await requireActiveClientFromRequest(req);
```

### Database Queries

```typescript
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);

// Always use tagged template literals (parameterized, safe from injection)
const result = await sql`
  SELECT * FROM clients WHERE slug = ${slug} LIMIT 1
`;
```

### Session Management

Sessions are stored as JSON in httpOnly cookies:

```typescript
// Set cookie (Pages Router)
res.setHeader('Set-Cookie', serialize('client_session', JSON.stringify({
  id, email, slug, nombre_completo, status
}), { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 }));

// Read in middleware
const session = JSON.parse(request.cookies.get('client_session').value);
```

### Mercado Pago Webhook Security

**CRITICAL:** Webhooks validate HMAC signature to prevent fraud:

```typescript
import crypto from 'crypto';
const hmac = crypto.createHmac('sha256', mp_secret_key);
hmac.update(dataID + url);
const signature = hmac.digest('hex');

if (signature !== receivedSignature) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

## Important Notes

### Temporary WhatsApp Redirect

`/propuesta` plan buttons currently redirect to WhatsApp to avoid sending users through an incomplete onboarding. When the full flow is ready:

1. Change links in `app/(marketing)/propuesta/page.tsx` to `/register?plan=X`
2. Verify payment webhook → onboarding → panel flow end-to-end
3. Test Google Calendar connection in a fresh session

### Database Schema Changes

Always create migration files in `lib/migrations/` and run manually via Neon console:

```sql
-- Example: Add new column
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS new_field varchar(255);

COMMENT ON COLUMN clients.new_field IS 'Description';
```

### Cal.com (Deprecated)

Cal.com integration was replaced by native Google Calendar API. The legacy columns (`cal_managed_user_id`, `cal_access_token`, `cal_schedule_id`) remain in the `clients` table but are no longer used. The `pages/api/calcom/` routes are legacy — do not build new features on top of them.

### Git Commit Convention

All commits include AI attribution:

```
feat: description

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

## Common Tasks

### Adding a New Biolink Field

1. Add migration: `lib/migrations/add-{field}-field.sql`
2. Run migration in Neon console
3. Update TypeScript types in relevant components
4. Add field to Step 1 form if user-configurable
5. Update `BioLinkPreview` component to display field

### Creating a New API Endpoint

1. Add file in `pages/api/` (not `app/api/`)
2. Use appropriate auth helper (`requireAdmin` or `requireActiveClientFromRequest`)
3. Validate input with early returns
4. Use parameterized queries with `sql` tagged templates
5. Return consistent JSON: `{ success: true, data }` or `{ error: 'message' }`

### Adding a New Consultation Event Field

1. Add column to `eventos` table in Neon console
2. Update `POST /api/eventos` and `PUT /api/eventos/[id]`
3. Update `wizard-step2b.tsx` form
4. Update `app/reserva/[slug]/BookingFlow.tsx` if patient-facing

### Testing Google Calendar Locally

1. Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` to `.env.local`
2. Set redirect URI to `http://localhost:3000/api/google/callback` in Google Console
3. Connect account via onboarding Step 2
4. Create a test booking and confirm it — verify GCal event is created

## File Reference

```
middleware.ts                              Route protection
lib/auth/                                  Auth utilities (client + admin)
lib/google-calendar.ts                     Google Calendar API wrapper
lib/encryption.ts                          Token encryption/decryption
lib/email.ts                               Email notifications
lib/migrations/                            SQL migration files

app/(auth)/onboarding/
  OnboardingWizard.tsx                     Step orchestrator (4 steps)
  wizard-step1.tsx                         Step 1: Identity & profile
  wizard-step2-google.tsx                  Step 2: Google Calendar OAuth
  wizard-step2b.tsx                        Step 3: Consultation types & availability
  wizard-step5-payment.tsx                 Step 4: Payment setup

app/(auth)/panel/
  PanelClient.tsx                          Professional dashboard

app/components/
  BioLinkPreview.tsx                       Real-time biolink preview
  BioLinkTemplate.tsx                      Public biolink page template

pages/api/
  google/auth-url.ts                       Generate Google OAuth URL
  google/callback.ts                       Google OAuth callback
  google/check-connection.ts              Check Google connection status
  eventos/index.ts                         List / create consultation types
  eventos/[id].ts                          Update / delete consultation type
  disponibilidad/index.ts                  Manage availability blocks
  slots/[slug].ts                          Get available time slots
  reservar.ts                              Create booking (public)
  confirmar-turno.ts                       Confirm/reject booking + GCal event
  mis-turnos.ts                            List professional's bookings
  upload-comprobante.ts                    Upload transfer proof to Cloudinary
  accion-turno.ts                          Cancel booking via magic link (patient)
  onboarding/step1.ts                      Save identity data
  onboarding/step5.ts                      Save payment method
  webhooks/mercadopago.ts                  MP payment webhook
  register.ts                              New client registration
  client-login.ts                          Client login
```
