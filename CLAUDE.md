# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**e-bio-link** is a SaaS platform for healthcare professionals to manage appointments and payments. It provides:
- Professional biolink pages (ebiolink.com/slug)
- Mercado Pago integration for consultation payments
- Calendar integration (Cal.com/Google Calendar) for appointment scheduling
- Multi-step onboarding wizard for new clients

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
- **`(auth)/`** - Protected routes: onboarding, registration
- **`(admin)/`** - Admin panel (requires admin_session cookie)
- **`(producto)/`** - Product-related pages
- **`pages/api/`** - API routes (Next.js Pages Router for API only)

### Authentication System

**Two separate auth systems:**

1. **Admin Authentication** (`lib/auth/admin-auth.ts`)
   - Cookie: `admin_session` (JSON with id, email)
   - Protected routes: `/admin/*`
   - Used by: Admin panel, client management

2. **Client Authentication** (`lib/auth/client-auth.ts`)
   - Cookie: `client_session` (JSON with id, email, status)
   - Protected routes: `/onboarding/*`
   - Status: 'pending' (payment pending) or 'active' (paid)

**Middleware** (`middleware.ts`):
- Protects `/admin/*` and `/onboarding/*` routes
- Validates session cookies and redirects if unauthorized

### Database (Neon Serverless PostgreSQL)

**Key Tables:**
- `admins` - Admin users with bcrypt hashed passwords
- `clients` - Healthcare professionals (UUID primary keys, slug for biolinks)
- `bookings` - Appointment reservations

**Client Table Key Fields:**
- `slug` - Unique identifier for biolink URL (e.g., 'dr-juan-perez')
- `mp_access_token`, `mp_refresh_token`, `mp_user_id` - Mercado Pago OAuth
- `cal_managed_user_id`, `cal_access_token`, `cal_schedule_id` - Cal.com integration
- `nombre_completo`, `especialidad`, `matricula` - Professional data
- `tema_config` (JSONB) - Color scheme: {background, text, buttonBorder, separator}
- `botones_config` (JSONB) - Social links array
- `monto_consulta` - Consultation price in ARS cents

**Migrations:** Located in `lib/migrations/` - Run manually via Neon console

### Payment Flow (Mercado Pago)

1. User selects plan on `/propuesta` → redirects to `/register?plan=X`
2. Registration creates client with status='pending'
3. `/api/register` creates Mercado Pago preference, returns `init_point`
4. User completes payment on Mercado Pago
5. Webhook `/api/webhooks/mercadopago` updates client status to 'active'
6. User redirected to `/onboarding` to complete profile

**OAuth Integration:** `/api/callback` handles Mercado Pago OAuth to store access tokens

### Onboarding Wizard

**3-Step Process** (`app/(auth)/onboarding/`):

**Step 1 - Identity** (`wizard-step1.tsx`):
- Personal info: photo, name, specialty, license, bio, price
- 6 color palette options
- Dynamic social links management
- Real-time preview with `BioLinkPreview` component
- Saves to `/api/onboarding/step1`

**Step 2 - Calendar** (`wizard-step2.tsx`):
- Email confirmation for calendar
- Availability selection (days of week)
- Time range (start/end hours)
- Creates managed user in Cal.com Platform via `/api/onboarding/step2`
- Stores `cal_managed_user_id`, `cal_access_token`, `cal_schedule_id`

**Step 3 - Mercado Pago OAuth** (placeholder):
- Will connect MP account for receiving payments

### Image Upload (Cloudinary)

**Two endpoints:**
- `/api/upload-profile-photo` - For admins (requires admin_session)
- `/api/upload-client-photo` - For clients (requires client_session)

**Configuration:**
- Folder: `e-bio-link/client-profiles` or `e-bio-link/profiles`
- Transformations: 500x500 crop, face gravity, auto quality/format

### Environment Variables

Required in Vercel:

```env
# Mercado Pago OAuth
MP_CLIENT_ID=
MP_CLIENT_SECRET=
MP_REDIRECT_URI=https://your-domain.com/api/callback
MP_ACCESS_TOKEN=

# Database
DATABASE_URL=postgresql://...

# Admin
ADMIN_SECRET_KEY=  # Generate with: openssl rand -hex 32

# Cal.com Platform (for managed users)
CAL_COM_CLIENT_ID=
CAL_COM_SECRET_KEY=

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Key Patterns

### API Route Authentication

```typescript
// Admin routes
import { requireAdmin } from '@/lib/auth/admin-auth';
const admin = await requireAdmin();  // Throws if not authenticated

// Client routes
import { requireActiveClient } from '@/lib/auth/client-auth';
const client = await requireActiveClient();  // Throws if not active
```

### Database Queries

```typescript
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);

// Use tagged template literals
const result = await sql`
  SELECT * FROM clients WHERE slug = ${slug} LIMIT 1
`;
```

### Session Management

Sessions are stored as JSON in cookies:

```typescript
// Set cookie
cookies().set('admin_session', JSON.stringify({ id, email }), {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7 // 7 days
});

// Read in middleware
const session = JSON.parse(request.cookies.get('client_session').value);
```

### Mercado Pago Webhook Security

**CRITICAL:** Webhooks use signature validation to prevent fraud:

```typescript
// Generate signature
import crypto from 'crypto';
const hmac = crypto.createHmac('sha256', mp_secret_key);
hmac.update(dataID + url);
const signature = hmac.digest('hex');

// Compare with x-signature header
if (signature !== receivedSignature) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

## Important Notes

### Temporary WhatsApp Redirect

Currently, `/propuesta` plan buttons redirect to WhatsApp instead of `/register` to avoid incomplete onboarding. When onboarding is ready:

1. Change links in `app/(marketing)/propuesta/page.tsx` back to `/register?plan=X`
2. Complete Step 3 of onboarding wizard
3. Test full flow end-to-end

### Cal.com Platform Pricing

Cal.com Platform is a paid service (~$99-299 USD/month). Consider alternatives:
- **Google Calendar API** (free, recommended for MVP)
- Self-hosted Cal.com (free but requires infrastructure)

### Database Schema Changes

Always create migrations in `lib/migrations/` and run manually in Neon console:

```sql
-- Example: Add new column
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS new_field varchar(255);

COMMENT ON COLUMN clients.new_field IS 'Description';
```

### Git Commit Convention

All commits include AI attribution:

```
feat: description

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
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
2. Use appropriate auth helper (`requireAdmin` or `requireActiveClient`)
3. Validate input with early returns
4. Use parameterized queries with `sql` tagged templates
5. Return consistent JSON: `{ success: true, data }` or `{ error: 'message' }`

### Testing Payment Flow Locally

1. Use Mercado Pago test credentials
2. Set webhook URL to ngrok: `https://xxx.ngrok.io/api/webhooks/mercadopago`
3. Monitor webhook calls in `/api/webhooks/mercadopago` logs
4. Check client status updates in database

## File Reference

- `middleware.ts` - Route protection
- `lib/auth/` - Authentication utilities
- `lib/migrations/` - Database migrations
- `app/(auth)/onboarding/` - Onboarding wizard
- `app/components/BioLinkPreview.tsx` - Biolink preview component
- `pages/api/onboarding/` - Onboarding API endpoints
- `pages/api/webhooks/` - External webhook handlers
- `docs/CALCOM_SETUP.md` - Cal.com integration guide
