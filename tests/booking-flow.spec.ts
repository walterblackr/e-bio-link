/**
 * Tests end-to-end del flujo de reserva completo.
 *
 * Prerequisitos:
 *  - Migración add-booking-public-token.sql aplicada en Neon
 *  - Variables de entorno:
 *      TEST_SLUG       slug del profesional de prueba (transfer + eventos activos)
 *      TEST_EVENTO_ID  UUID del evento a reservar
 *
 * Para obtener el evento_id:
 *   GET /api/eventos?slug=TU_SLUG desde el panel del profesional
 */
import { test, expect } from '@playwright/test';

const SLUG = process.env.TEST_SLUG || 'test';

test.describe('Flujo de reserva', () => {
  test('paso 1: carga la página del profesional y muestra eventos', async ({ page }) => {
    await page.goto(`/reserva/${SLUG}`);

    // Debe cargar el nombre del profesional y al menos un evento
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });

    // Debe haber al menos una tarjeta de consulta
    const cards = page.locator('[data-testid="evento-card"], .rounded-xl').first();
    await expect(cards).toBeVisible({ timeout: 10_000 });
  });

  test('API /api/reservar devuelve public_token', async ({ request }) => {
    const eventoId = process.env.TEST_EVENTO_ID;
    if (!eventoId) {
      test.skip(true, 'TEST_EVENTO_ID no configurado');
      return;
    }

    const res = await request.post('/api/reservar', {
      data: {
        client_slug: SLUG,
        evento_id: eventoId,
        fecha_hora: getNextMonday10am(),
        paciente_nombre: 'Test Playwright',
        paciente_email: 'playwright@example.com',
        paciente_telefono: '1122334455',
      },
    });

    expect(res.ok()).toBe(true);
    const body = await res.json();

    // Verificar campos clave en la respuesta
    expect(body.booking_id).toBeTruthy();
    expect(body.public_token).toBeTruthy();
    expect(body.payment_method).toBeTruthy();
    expect(body.evento).toMatchObject({
      nombre: expect.any(String),
      modalidad: expect.stringMatching(/virtual|presencial/),
    });

    // Si es transfer, deben venir los datos bancarios
    if (body.payment_method === 'transfer') {
      expect(body.transfer_data).toBeTruthy();
    }

    console.log(`✓ Booking creado: id=${body.booking_id} token=${body.public_token}`);
  });

  test('API /api/booking-by-token devuelve datos de la reserva', async ({ request }) => {
    const eventoId = process.env.TEST_EVENTO_ID;
    if (!eventoId) {
      test.skip(true, 'TEST_EVENTO_ID no configurado');
      return;
    }

    // 1. Crear la reserva
    const createRes = await request.post('/api/reservar', {
      data: {
        client_slug: SLUG,
        evento_id: eventoId,
        fecha_hora: getNextMonday10am(1), // desplazamos 1 día para evitar colisión
        paciente_nombre: 'Test Token Playwright',
        paciente_email: 'playwright-token@example.com',
      },
    });
    expect(createRes.ok()).toBe(true);
    const { public_token } = await createRes.json();

    // 2. Obtener por token
    const tokenRes = await request.get(`/api/booking-by-token?token=${public_token}`);
    expect(tokenRes.ok()).toBe(true);
    const { booking } = await tokenRes.json();

    expect(booking.estado).toBe('pending_payment');
    expect(booking.slug).toBe(SLUG);
    expect(booking.expires_at).toBeTruthy();
    expect(booking.public_token).toBe(public_token);

    console.log(`✓ Booking por token: estado=${booking.estado} expires=${booking.expires_at}`);
  });

  test('página /pago?token= muestra instrucciones cuando la reserva está vigente', async ({ page, request }) => {
    const eventoId = process.env.TEST_EVENTO_ID;
    if (!eventoId) {
      test.skip(true, 'TEST_EVENTO_ID no configurado');
      return;
    }

    // Crear reserva
    const createRes = await request.post('/api/reservar', {
      data: {
        client_slug: SLUG,
        evento_id: eventoId,
        fecha_hora: getNextMonday10am(2),
        paciente_nombre: 'Test UI Playwright',
        paciente_email: 'playwright-ui@example.com',
      },
    });
    if (!createRes.ok()) {
      test.skip(true, `No se pudo crear reserva: ${await createRes.text()}`);
      return;
    }
    const { public_token, payment_method } = await createRes.json();

    if (payment_method !== 'transfer') {
      test.skip(true, 'Profesional usa MP — esta prueba es solo para transfer');
      return;
    }

    // Navegar a la página de pago
    await page.goto(`/reserva/${SLUG}/pago?token=${public_token}`);

    // Verificar encabezado
    await expect(page.getByText('Completá el pago')).toBeVisible({ timeout: 12_000 });

    // Verificar monto visible
    await expect(page.locator('.bg-green-50')).toBeVisible();

    // Verificar uploader
    await expect(page.getByText('Subí el comprobante')).toBeVisible();
    await expect(page.getByRole('button', { name: /Enviar comprobante/i })).toBeDisabled();

    // Verificar plazo
    await expect(page.getByText(/Plazo para pagar/i)).toBeVisible();
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function getNextMonday10am(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7) + offsetDays);
  d.setHours(10, 0, 0, 0);
  const tzOffset = '-03:00';
  return d.toISOString().slice(0, 19) + tzOffset;
}
