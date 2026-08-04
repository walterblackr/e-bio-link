# Plan — Ventana de pago única y configurable (v3, verificada contra el código)

## Registro de cambios (trazabilidad)

**v3 (2026-08-03)** — Ajustes tras verificar cada supuesto contra el código real:

| # | Cambio respecto de v2 | Motivo |
|---|---|---|
| 1 | El correo de expiración usa una función nueva `sendReservaExpirada()` en `lib/email.ts` | El `sendEmail` genérico que importaba v2 **no existe**: `lib/email.ts` solo tiene funciones específicas que llaman a `resend.emails.send` directamente |
| 2 | Backfill cambiado a `LEAST(now() + ventana, fecha_hora)` (ventana fresca desde el deploy) | El backfill de v2 (`created_at + ventana`) tenía la zona horaria invertida (`created_at` es `TIMESTAMP` en UTC, no hora argentina) y además habría provocado **cancelación masiva + mails masivos** en el primer barrido del cron sobre reservas históricas |
| 3 | El cron envía correo **solo si `fecha_hora > now()`** (cancela igual todas las vencidas) | Avisar "venció tu reserva" de un turno cuya fecha ya pasó es ruido y genera consultas confundidas |
| 4 | La condición de vigencia se aplica en **3 lugares**, no 1: ocupados en slots, conteo `max_por_dia` en slots y conteo `max_por_dia` en reservar | Si no, las reservas vencidas liberan el horario pero siguen consumiendo el cupo diario — inconsistente |
| 5 | `expires_at IS NULL` se trata como "no expira" en todas las consultas | Una `pending_payment` sin deadline (backfill incompleto, fila vieja) se comporta como hoy (bloquea el slot); nunca se libera un slot de una reserva legítima por accidente |
| 6 | Validación de vigencia también en `crear-preferencia-pago` (flujo Mercado Pago) | v2 solo cubría el pago tardío por transferencia. Si el cron cancela y el paciente paga por MP, el webhook no matchea el booking (`estado IN ('pending_payment','pending','paid')`) → plata cobrada sin turno. Validar antes de generar el `init_point` reduce la ventana de carrera al mínimo |
| 7 | En `reservar.ts` **solo se agrega `expires_at`** al INSERT existente | v2 reescribía el INSERT completo pisando la lógica de seña (`cobro_tipo`/`sena_monto`) y `notas` que ya están implementadas (commit c7850df) |
| 8 | Checklist de verificación previa: resuelto (ver tabla abajo) | Ya se verificó todo contra el código |

**v2** — Se descartó el recordatorio "del medio"; se sumó el correo al paciente al vencer; disparador pasó a cron-job.org.
**v1** — Versión inicial.

### Supuestos verificados (2026-08-03)

| Supuesto | Resultado |
|---|---|
| Estado que escribe `reservar.ts` | `'pending_payment'` (`pages/api/reservar.ts:132`) |
| Lógica de slots | `estado NOT IN ('cancelled')` en **dos** lugares: conteo max_por_dia (`slots/[slug].ts:107`) y ocupados (`slots/[slug].ts:183`) |
| Tipo de `bookings.created_at` | `TIMESTAMP` sin zona; Neon guarda UTC |
| Endpoint de settings del panel | No existe `pages/api/panel/` — se crea |
| Firma de email | No hay `sendEmail` genérico; patrón: función por template + `resend.emails.send` |
| `upload-comprobante.ts` | Hoy **no valida estado**: acepta y pasa a `pending_confirmation` sin chequear (`:109-113`) |
| Flujo MP de bookings | `handlePagarMP` → `/api/crear-preferencia-pago`; webhook matchea solo `estado IN ('pending_payment','pending','paid')` (`webhooks/mercadopago.ts:150`) |
| Liberación manual | Ya existe (commit 2a6546a); este plan la automatiza, no la pisa |

---

# Parte A — Explicación en lenguaje natural

## El problema, en una frase

Cuando un paciente reserva un horario pero no llega a pagar, ese horario queda "tapado" y ningún otro paciente lo puede tomar. Queremos que, si no paga en un tiempo razonable, el horario se libere solo y el paciente se entere de que su reserva se cayó.

## La solución: un reloj de 2 horas

Cada reserva sin pagar arranca un reloj de **2 horas**. Si el paciente paga (sube el comprobante) antes de que suene, todo sigue. Si no, la reserva se da por caída.

Cada profesional puede cambiar ese reloj desde su panel (30 minutos, 6 horas, lo que prefiera). Por defecto son 2 horas, que es el equilibrio que mejor funciona para pagos por transferencia.

**Ejemplo.** María entra el martes **15:00** y reserva con la Lic. Fernández. El sistema le guarda el lugar y le manda los datos para transferir. Su reloj vence a las **17:00**.

- Si María transfiere y sube el comprobante **16:20** → todo bien, su turno sigue esperando confirmación.
- Si a las **17:00** no pagó → su reserva se cae, el horario vuelve a estar libre, y le llega un mail avisándole.

## Cómo se libera el horario: "lazy" (perezoso)

El horario no se libera "a las 17:00 en punto" con alguien vigilando: se libera **cuando otro paciente entra a mirar los turnos disponibles**. En ese momento el sistema ve la reserva vencida de María, la ignora, y muestra el horario libre. No necesita ningún proceso corriendo ni cuesta nada: la propia página hace el trabajo cada vez que alguien consulta.

## Los dos tipos de correos

1. **Correos disparados por una acción** (reservaste / recibimos tu comprobante / turno confirmado): hay una persona haciendo clic en ese momento — salen solos.
2. **El correo de "se venció tu reserva"**: a las 17:00 María se fue (por eso no pagó). No hay clic. Alguien tiene que acordarse de mirar el reloj con ella ausente → necesita un "despertador".

## El despertador: cron-job.org

Servicio gratis que cada 15 minutos le "toca el timbre" al sistema: *"¿venció alguna reserva desde la última vez?"*. El sistema cancela las vencidas y manda los avisos. No hace falta exactitud al segundo: si María se entera 17:12 en vez de 17:00, no cambia nada, y el horario ya se liberó solo (lazy).

## Resumen de una línea

El horario se libera solo cuando otro paciente mira (gratis, sin despertador). El aviso a la persona que se fue necesita el despertador de cron-job.org, cada 15 minutos.

---

# Parte B — Plan técnico

## Decisión de diseño

El deadline se guarda como timestamp explícito (`expires_at`), calculado **al crear** la reserva. Única fuente de verdad: disponibilidad y cancelación miran la misma columna. Cambiar la ventana del profesional afecta solo a reservas nuevas.

La **disponibilidad es lazy**: un `pending_payment` vencido se excluye del cálculo de slots en el momento de la consulta, sin depender del cron. El cron solo limpia (pasa a `cancelled`) y envía el correo.

**Regla defensiva global:** `expires_at IS NULL` = no expira (se comporta como hoy: bloquea el slot y el cron no la toca). Nunca se libera por accidente una reserva sin deadline.

## Paso 1 — Migración

Archivo: `lib/migrations/add-payment-window.sql` — correr manual en Neon **antes** de deployar código.

```sql
-- 1) Ventana configurable por profesional (minutos). Default 120 = 2h.
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS payment_window_minutes INTEGER NOT NULL DEFAULT 120;

COMMENT ON COLUMN clients.payment_window_minutes IS
  'Minutos para pagar antes de que la reserva expire y el slot se libere. Default 120 (2h).';

-- 2) Deadline explícito por reserva (snapshot al crear).
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

COMMENT ON COLUMN bookings.expires_at IS
  'Expiración del pending_payment. Se calcula al crear = min(created_at + ventana, fecha_hora). NULL = no expira.';

-- 3) Backfill AMISTOSO: ventana fresca desde ahora para todas las pending_payment vivas.
--    (No usar created_at: es TIMESTAMP en UTC y además cancelaría en masa las históricas
--     en el primer barrido, con mails masivos a pacientes de turnos viejos.)
UPDATE bookings
SET expires_at = LEAST(
      now() + interval '120 minutes',
      fecha_hora
    )
WHERE estado = 'pending_payment'
  AND expires_at IS NULL;

-- 4) Índice para disponibilidad y barridos del cron.
CREATE INDEX IF NOT EXISTS idx_bookings_pending_expiry
  ON bookings (client_id, estado, expires_at);
```

Nota: el backfill usa 120 fijo (default global); las reservas nuevas ya usan la ventana del profesional. Para turnos con `fecha_hora` ya pasada, `LEAST` deja `expires_at` en el pasado → el cron las cancela en el primer barrido **sin mail** (regla del Paso 6).

## Paso 2 — Calcular `expires_at` al reservar

Archivo: `pages/api/reservar.ts`. **No reescribir el INSERT** (ya incluye seña y notas — commit c7850df). Cambios mínimos:

1. Sumar `payment_window_minutes` al SELECT de `clients` (línea ~47).
2. Calcular antes del INSERT:

```ts
const windowMin = Number(client.payment_window_minutes) || 120;
const expiresAt = new Date(Math.min(
  Date.now() + windowMin * 60_000,
  new Date(fecha_hora).getTime()
));
```

3. Agregar la columna `expires_at` y el valor `${expiresAt.toISOString()}` al INSERT existente (líneas ~111-137).
4. Además: el conteo de `max_por_dia` (línea ~89-95) pasa a usar la condición de vigencia del Paso 3.

## Paso 3 — Disponibilidad lazy (el fix central, en 3 lugares)

Condición de "ocupa lugar" unificada:

```sql
(
  estado NOT IN ('cancelled', 'pending_payment')
  OR (estado = 'pending_payment' AND (expires_at IS NULL OR expires_at > now()))
)
```

Aplicarla en:
- **`pages/api/slots/[slug].ts` — consulta de ocupados** (línea ~180-186, hoy `estado NOT IN ('cancelled')`).
- **`pages/api/slots/[slug].ts` — conteo `max_por_dia`** (línea ~104-108, misma condición actual).
- **`pages/api/reservar.ts` — conteo `max_por_dia`** (línea ~89-95).

Una vencida no bloquea el horario **ni** consume cupo diario. Una con `expires_at` NULL sigue bloqueando (regla defensiva).

## Paso 4 — Endpoint para editar la ventana

Archivo: `pages/api/panel/configuracion.ts` (nuevo; no existe `pages/api/panel/`).

```ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { requireActiveClientFromRequest } from '../../../lib/auth/client-auth';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const client = await requireActiveClientFromRequest(req);

    const win = Number(req.body?.payment_window_minutes);
    if (!Number.isInteger(win) || win < 30 || win > 2880) {
      return res.status(400).json({ error: 'La ventana debe estar entre 30 minutos y 48 horas.' });
    }

    await sql`
      UPDATE clients SET payment_window_minutes = ${win}, updated_at = now()
      WHERE id = ${client.id}
    `;
    return res.status(200).json({ success: true, payment_window_minutes: win });
  } catch {
    return res.status(401).json({ error: 'No autorizado' });
  }
}
```

## Paso 5 — Control en el panel

Archivo: `app/(auth)/panel/PanelClient.tsx`. Select con opciones 30 min / 1h / **2h (recomendado)** / 6h / 12h / 24h / 48h que postea a `/api/panel/configuracion`. Valor inicial: sumar `payment_window_minutes` al SELECT/props que hidratan el panel.

Copy debajo: *"Pasado este tiempo sin comprobante, el turno se cancela solo y el horario queda libre para otros pacientes. Para señas por transferencia, 2 horas suele ser el mejor equilibrio."*

## Paso 6 — Endpoint de expiración: cancela + avisa

Archivo: `pages/api/cron/expirar-reservas.ts` (nuevo).

- Protegido por header `Authorization: Bearer ${CRON_SECRET}`.
- `UPDATE ... RETURNING` garantiza un solo mail por reserva (en el próximo barrido ya están `cancelled`).
- **Mail solo si el turno es futuro**: cancelar una reserva cuya fecha ya pasó es limpieza, avisarla es ruido.

```ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { sendReservaExpirada } from '../../../lib/email';  // nueva función, Paso 7

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const expiradas = await sql`
    UPDATE bookings b
    SET estado = 'cancelled', updated_at = now()
    FROM clients c
    WHERE b.client_id = c.id
      AND b.estado = 'pending_payment'
      AND b.expires_at IS NOT NULL
      AND b.expires_at <= now()
    RETURNING b.id, b.paciente_nombre, b.paciente_email, b.fecha_hora,
              c.slug, c.nombre_completo
  `;

  let enviados = 0;
  for (const r of expiradas) {
    if (new Date(r.fecha_hora) <= new Date()) continue; // turno ya pasado: sin mail
    try {
      await sendReservaExpirada({
        paciente_nombre: r.paciente_nombre,
        paciente_email: r.paciente_email,
        fecha_hora: r.fecha_hora,
        medico_nombre: r.nombre_completo,
        slug: r.slug,
      });
      enviados++;
    } catch (err) {
      console.error(`Falló el aviso de expiración de la reserva ${r.id}:`, err);
    }
  }

  return res.status(200).json({ canceladas: expiradas.length, correos: enviados });
}
```

## Paso 7 — Correo de expiración: `sendReservaExpirada` en `lib/email.ts`

**No existe `sendEmail` genérico.** Crear la función siguiendo el patrón de las existentes (guard de `RESEND_API_KEY`, constante `FROM`, mismo estilo HTML, `resend.emails.send`). Fecha formateada con `Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })` (mismo criterio que `formatFecha`).

Copy (segunda chance, no mala noticia):

```
Asunto: Tu reserva con [Profesional] venció — podés reservar de nuevo

Hola [Nombre], venció el plazo para completar el pago de tu turno del
[día y hora] con [Profesional], así que liberamos ese horario.

Quedate tranquilo/a: no se cobró nada. Si todavía querés atenderte,
podés reservar de nuevo —ese mismo horario u otro— acá:
https://ebiolink.app/[slug]
```

## Paso 8 — Bloquear el pago tardío (transferencia Y Mercado Pago)

**8a. `pages/api/upload-comprobante.ts`** — hoy no valida nada. Antes de aceptar el comprobante:
- La reserva debe seguir `estado = 'pending_payment'` y `(expires_at IS NULL OR expires_at > now())`.
- Si venció: responder 410 con mensaje claro ("Tu reserva expiró — podés reservar de nuevo en https://ebiolink.app/[slug]") y **no** subir el archivo ni cambiar estado.

**8b. `pages/api/crear-preferencia-pago.ts`** (flujo MP de bookings, llamado por `handlePagarMP`) — misma validación antes de generar el `init_point`. Motivo: si el cron canceló la reserva y el paciente paga igual, el webhook no matchea el booking (busca `estado IN ('pending_payment','pending','paid')`, `webhooks/mercadopago.ts:150`) → pago cobrado sin turno. Validar acá reduce la ventana de carrera a "checkout ya abierto al momento de vencer" (residual, aceptable; queda documentado).

**8c. UI (`BookingFlow.tsx`)** — manejar el 410 en ambos flujos mostrando el mensaje y el link para reservar de nuevo.

## Paso 9 — Configurar cron-job.org

1. Cargar `CRON_SECRET` en Vercel (**antes** de crear el cronjob) y redeployar.
2. Cuenta gratis en cron-job.org → **Create cronjob**.
3. Title: `Expirar reservas e-bio-link` · URL: `https://ebiolink.app/api/cron/expirar-reservas`.
4. Schedule: cada 15 minutos (`*/15 * * * *`).
5. Advanced: Request method `POST` · Header `Authorization: Bearer <CRON_SECRET>`.
6. Guardar habilitado y probar con **Run now** → debe responder `200` con `{ canceladas, correos }`.

## Edge cases

- **Pago tardío** — cubierto en Paso 8 (transferencia y MP). Ventana de carrera residual del checkout MP abierto: documentada, aceptada.
- **Correo idempotente** — garantizado por `UPDATE ... RETURNING`; el que pagó ya está en `pending_confirmation`/`paid` y no entra.
- **`expires_at` NULL** — bloquea el slot y el cron no la toca (regla defensiva). Comportamiento idéntico al actual.
- **Cambio de ventana con reservas vivas** — las existentes mantienen su `expires_at`; solo aplica a nuevas.
- **Turno más cercano que la ventana** — `min(..., fecha_hora)` recorta el deadline a la hora del turno.
- **Zona horaria** — instantes (`timestamptz` + `now()`); el correo formatea en horario argentino.
- **Doble reserva simultánea** (carrera en el INSERT) — problema aparte, fuera de alcance.

## Checklist de testing

- [ ] Crear reserva → `expires_at ≈ now() + 120 min` con el default (y respeta la ventana del profesional si la cambió).
- [ ] Cambiar ventana a 30 → nueva reserva usa 30; las existentes no cambian.
- [ ] **Lazy sin cron:** reservar, no pagar, forzar `expires_at` al pasado por SQL, consultar `slots/[slug]` → el slot aparece libre y **no** consume `max_por_dia`.
- [ ] Reserva `pending_payment` con `expires_at` NULL → sigue bloqueando y el cron no la cancela.
- [ ] Durante la ventana el slot NO aparece; en `pending_confirmation` tampoco.
- [ ] Disparar el cron → cancela solo las vencidas; `pending_confirmation`/`confirmed`/`paid` intactas.
- [ ] Reserva vencida con `fecha_hora` futura → **un** correo con fecha argentina y link al biolink. Con `fecha_hora` pasada → se cancela **sin** correo.
- [ ] Segundo disparo seguido → `canceladas: 0`, sin correos repetidos.
- [ ] Subir comprobante con reserva vencida → 410, sin upload, mensaje con link para reservar de nuevo.
- [ ] `handlePagarMP` con reserva vencida → 410 antes de generar el `init_point`.
- [ ] Config: ventana < 30 o > 2880 → 400. Sin sesión → 401.
- [ ] Cron sin `CRON_SECRET` correcto → 401.

## Variables de entorno nuevas

```env
CRON_SECRET=   # openssl rand -hex 32 — cargar en Vercel ANTES de crear el cronjob
```

## Orden de despliegue (seguro para usuarios actuales)

1. **Migración** (columnas + backfill fresco + índice) — las reservas vivas reciben 2h de gracia desde este momento; nada se cancela ni se libera todavía.
2. **`reservar.ts`** (calcular `expires_at` + condición en max_por_dia).
3. **`slots/[slug].ts`** (exclusión lazy en ambas consultas). → Con 1–3 el slot ya se libera solo: 80% del problema resuelto, sin cron y sin mails.
4. **Paso 8** (validaciones de pago tardío + manejo 410 en UI).
5. **Panel + endpoint de configuración**.
6. **Endpoint de expiración + `sendReservaExpirada`**, cargar `CRON_SECRET`, y recién ahí **conectar cron-job.org**.

Cada paso funciona sin el siguiente; en ningún punto un usuario existente pierde una reserva legítima ni recibe un mail retroactivo.
