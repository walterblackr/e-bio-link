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
| `oauth_sessions` | Temporary OAuth session tracking |

**`admins` Table:**
```sql
id                   UUID PRIMARY KEY DEFAULT gen_random_uuid()
email                VARCHAR(255) UNIQUE NOT NULL
password_hash        TEXT NOT NULL
nombre               VARCHAR(255) NOT NULL
activo               BOOLEAN DEFAULT true
created_at           TIMESTAMP DEFAULT now()
updated_at           TIMESTAMP DEFAULT now()
```
| `bookings` | Appointment reservations |

**`clients` Table Key Fields:**
```sql
-- Primary key
id                   UUID PRIMARY KEY DEFAULT gen_random_uuid()

-- Auth
email                VARCHAR(255) UNIQUE
password_hash        TEXT
status               VARCHAR(50) DEFAULT 'pending_payment'  -- 'pending_payment' | 'active'

-- Identity (filled during onboarding step 1)
slug                 VARCHAR(255) UNIQUE NOT NULL
nombre_completo      VARCHAR(255) DEFAULT ''
especialidad         VARCHAR(255) DEFAULT ''
matricula            VARCHAR(100) DEFAULT ''
descripcion          TEXT DEFAULT ''
foto_url             TEXT DEFAULT ''

-- Biolink customization
tema_config          JSONB DEFAULT '{}'   -- {background, text, buttonBorder, separator}
botones_config       JSONB DEFAULT '[]'   -- array of social links

-- Google Calendar (active integration)
google_access_token  TEXT   -- Encrypted OAuth access token
google_refresh_token TEXT   -- Encrypted OAuth refresh token
google_email         VARCHAR(255)
google_calendar_id   VARCHAR(255) DEFAULT 'primary'
google_token_expiry  TIMESTAMP

-- Mercado Pago OAuth (for collecting payments from patients)
mp_access_token      TEXT NOT NULL DEFAULT ''
mp_refresh_token     TEXT
mp_user_id           VARCHAR(255) NOT NULL DEFAULT ''

-- Payment method configuration
payment_method       VARCHAR(20) DEFAULT 'mp'  -- 'transfer' | 'mercadopago'
cbu_alias            VARCHAR(100)
banco_nombre         VARCHAR(100)
titular_cuenta       VARCHAR(255)

-- Platform subscription
subscription_type    VARCHAR(50)   -- 'monthly' | 'semestral' | 'annual'
subscription_price   NUMERIC(10,2)
paid_at              TIMESTAMP
onboarding_mp_preference_id VARCHAR(255)
onboarding_mp_payment_id    VARCHAR(255)

-- Timestamps
created_at           TIMESTAMP DEFAULT now()
updated_at           TIMESTAMP DEFAULT now()

-- Legacy Cal.com (deprecated, do not use)
cal_api_key, cal_username, cal_event_type_id, monto_consulta
```

**IMPORTANT — NOT NULL columns in `clients`:**
- `slug` — always required
- `mp_access_token` — required (use `''` when creating via admin)
- `mp_user_id` — required (use `''` when creating via admin)

**`eventos` Table (Consultation Types):**
```sql
id                   UUID PRIMARY KEY DEFAULT gen_random_uuid()
client_id            UUID NOT NULL FK → clients(id) ON DELETE CASCADE
nombre               VARCHAR(100) NOT NULL
descripcion          TEXT
duracion_minutos     INTEGER NOT NULL DEFAULT 30
precio               NUMERIC(10,2) NOT NULL
activo               BOOLEAN NOT NULL DEFAULT true
modalidad            VARCHAR(20) DEFAULT 'virtual'  -- 'virtual' | 'presencial'
buffer_despues       INTEGER DEFAULT 0   -- break minutes after appointment
antelacion_minima    INTEGER DEFAULT 0   -- min lead time in minutes
max_por_dia          INTEGER             -- NULL = unlimited
direccion            VARCHAR(500)        -- for presencial appointments
created_at           TIMESTAMP DEFAULT now()
updated_at           TIMESTAMP DEFAULT now()
-- Legacy Cal.com (deprecated)
cal_event_type_id    INTEGER
cal_slug             VARCHAR(100)
```

**`disponibilidad` Table (Availability Blocks):**
```sql
id                   SERIAL PRIMARY KEY
client_id            UUID NOT NULL FK → clients(id) ON DELETE CASCADE
evento_id            UUID FK → eventos(id) ON DELETE CASCADE
dia_semana           INTEGER NOT NULL  -- 0=Sun ... 6=Sat (CHECK 0-6)
hora_inicio          TIME NOT NULL
hora_fin             TIME NOT NULL
activo               BOOLEAN DEFAULT true
created_at           TIMESTAMP DEFAULT now()
updated_at           TIMESTAMP DEFAULT now()
-- Multiple blocks per day per event are allowed
```

**`bookings` Table:**
```sql
-- Primary key
id                   SERIAL PRIMARY KEY

-- Relations
client_id            UUID NOT NULL FK → clients(id) ON DELETE CASCADE
evento_id            UUID FK → eventos(id) ON DELETE SET NULL

-- Patient info (NOT NULL)
paciente_nombre      VARCHAR(255) NOT NULL
paciente_email       VARCHAR(255) NOT NULL
paciente_telefono    VARCHAR(50)
fecha_hora           TIMESTAMP WITH TIME ZONE NOT NULL

-- Appointment details
duracion_minutos     INTEGER DEFAULT 30
monto                NUMERIC(10,2)
notas                TEXT
estado               VARCHAR(50) DEFAULT 'pending'
                     -- 'pending_payment' | 'pending_confirmation' | 'confirmed' | 'cancelled'
payment_method       VARCHAR(20) DEFAULT 'mp'  -- 'transfer' | 'mercadopago'

-- Payment tracking
mp_preference_id     VARCHAR(255)
mp_payment_id        VARCHAR(255)
mp_payment_status    VARCHAR(50) DEFAULT 'pending'
comprobante_url      VARCHAR(500)  -- Cloudinary URL for transfer proof
paid_at              TIMESTAMP
confirmed_at         TIMESTAMP

-- Google Calendar
google_event_id      VARCHAR(255)
meet_link            VARCHAR(500)

-- Timestamps
created_at           TIMESTAMP DEFAULT now()
updated_at           TIMESTAMP DEFAULT now()

-- Legacy Cal.com (deprecated)
cal_booking_id       VARCHAR(255) UNIQUE
cal_event_type_id    VARCHAR(255)
```

**`oauth_sessions` Table:**
```sql
session_id           UUID PRIMARY KEY
client_id            UUID (no FK constraint)
status               VARCHAR(50) DEFAULT 'pending'
created_at           TIMESTAMP DEFAULT now()
completed_at         TIMESTAMP
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
