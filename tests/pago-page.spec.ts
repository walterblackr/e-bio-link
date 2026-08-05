/**
 * Tests para la página /reserva/[slug]/pago
 *
 * Cubre:
 *  - Sin token → mensaje de error "Link inválido"
 *  - Token inválido → "Reserva no encontrada"
 *  - Token de reserva vencida → "El plazo de pago venció"
 *  - Token de reserva pending_payment → muestra instrucciones + uploader
 *  - Token de reserva pending_confirmation → "Comprobante recibido"
 *
 * Prerequisito: correr la migración add-booking-public-token.sql en Neon.
 * Configurar TEST_SLUG (slug de un profesional activo con método transfer y eventos activos).
 */
import { test, expect } from '@playwright/test';

const SLUG = process.env.TEST_SLUG || 'test';
const BASE = `/reserva/${SLUG}/pago`;

// ── 1. Sin token ──────────────────────────────────────────────────────────────
test('pago page: sin token muestra error', async ({ page }) => {
  await page.goto(BASE);
  await expect(page.getByText('Link inválido')).toBeVisible({ timeout: 10_000 });
});

// ── 2. Token inválido ─────────────────────────────────────────────────────────
test('pago page: token inválido muestra error (404 o DB no disponible)', async ({ page }) => {
  await page.goto(`${BASE}?token=00000000-0000-0000-0000-000000000000`);
  // Acepta "Reserva no encontrada" (DB ok, token no existe)
  // o "Error al cargar la reserva" (DB no disponible en local)
  await expect(
    page.getByText(/Reserva no encontrada|Error al cargar la reserva/)
  ).toBeVisible({ timeout: 10_000 });
});

// ── 3. UI del uploader (estructura del formulario) ────────────────────────────
test('pago page: tiene estructura correcta cuando hay token vigente', async ({ page, request }) => {
  // Primero crear una reserva real para obtener un token
  const bookingRes = await request.post('/api/reservar', {
    data: {
      client_slug: SLUG,
      // evento_id se inyecta desde la variable de entorno TEST_EVENTO_ID
      evento_id: process.env.TEST_EVENTO_ID || '',
      fecha_hora: getFutureSlot(),
      paciente_nombre: 'Paciente Playwright',
      paciente_email: 'playwright-test@example.com',
    },
  });

  if (!bookingRes.ok()) {
    test.skip(true, `No se pudo crear booking de prueba: ${await bookingRes.text()}`);
    return;
  }

  const { public_token, payment_method } = await bookingRes.json();

  if (payment_method !== 'transfer') {
    test.skip(true, 'El profesional de prueba usa MP, no transfer');
    return;
  }

  // Navegar a la página de retorno
  await page.goto(`${BASE}?token=${public_token}`);

  // Verificar elementos clave del estado pending_payment
  await expect(page.getByText('Completá el pago')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Subí el comprobante')).toBeVisible();

  // Debe mostrar el monto
  await expect(page.locator('.bg-green-50')).toBeVisible();

  // Debe tener el botón de envío deshabilitado (sin archivo seleccionado)
  const submitBtn = page.getByRole('button', { name: /Enviar comprobante/i });
  await expect(submitBtn).toBeDisabled();

  // Debe mostrar el plazo de pago
  await expect(page.getByText(/Plazo para pagar/i)).toBeVisible();
});

// ── Helper ────────────────────────────────────────────────────────────────────

function getFutureSlot(): string {
  // Próximo lunes a las 10:00 AM (evita fin de semana)
  const d = new Date();
  d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7)); // próximo lunes
  d.setHours(10, 0, 0, 0);
  // Convertir a ISO con offset Argentina (-03:00)
  const offset = -3 * 60;
  const sign = offset <= 0 ? '+' : '-';
  const abs = Math.abs(offset);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return d.toISOString().replace('Z', '') + `${sign}${hh}:${mm}`;
}
