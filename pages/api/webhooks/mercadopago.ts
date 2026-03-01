// Webhook para recibir notificaciones de pagos de Mercado Pago
import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { decrypt } from '../../../lib/encryption';
import { createEventForClient, deleteEventForClient } from '../../../lib/google-calendar';
import { sendBookingConfirmation, sendNewBookingNotification, sendBookingCancellation } from '../../../lib/email';
import axios from 'axios';
import crypto from 'crypto';

function validateMercadoPagoSignature(
  xSignature: string | undefined,
  xRequestId: string | undefined,
  dataId: string,
  secret: string
): boolean {
  if (!xSignature || !xRequestId) return false;

  const parts = xSignature.split(',');
  const tsMatch = parts.find((part) => part.startsWith('ts='));
  const hashMatch = parts.find((part) => part.startsWith('v1='));
  if (!tsMatch || !hashMatch) return false;

  const ts = tsMatch.replace('ts=', '');
  const receivedHash = hashMatch.replace('v1=', '');
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(manifest);
  return hmac.digest('hex') === receivedHash;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    return res.status(200).send('Webhook de Mercado Pago activo');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const topic = req.query.topic || req.body?.type || req.body?.action?.split('.')[0];
    const resourceId = req.query.id || req.body?.data?.id || req.body?.id;

    if (process.env.MERCADOPAGO_WEBHOOK_SECRET) {
      const xSignature = req.headers['x-signature'] as string | undefined;
      const xRequestId = req.headers['x-request-id'] as string | undefined;
      const isValid = validateMercadoPagoSignature(
        xSignature,
        xRequestId,
        resourceId,
        process.env.MERCADOPAGO_WEBHOOK_SECRET
      );
      if (!isValid) {
        console.error('[MP Webhook] Firma inválida - procesando de todas formas (debugging)');
        // TODO: Descomentar en producción:
        // return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    if (topic === 'payment') {
      const paymentId = resourceId;
      if (!paymentId) {
        return res.status(400).json({ error: 'No payment ID received' });
      }

      const sql = neon(process.env.DATABASE_URL!);

      // ── PRIMERO: Verificar si es pago de ONBOARDING ─────────────────────
      const platformToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
      if (platformToken) {
        try {
          const paymentResponse = await axios.get(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            { headers: { Authorization: `Bearer ${platformToken}` } }
          );

          const payment = paymentResponse.data;
          const externalReference = payment.external_reference;

          if (externalReference) {
            const clientCheck = await sql`
              SELECT id, email, slug, status, onboarding_mp_payment_id
              FROM clients
              WHERE id = ${externalReference}
                AND status = 'pending_payment'
              LIMIT 1
            `;

            if (clientCheck.length > 0) {
              const client = clientCheck[0];

              if (client.onboarding_mp_payment_id && client.onboarding_mp_payment_id === paymentId) {
                return res.status(200).json({ success: true, message: 'Onboarding payment already processed (idempotent)' });
              }

              if (payment.status === 'approved') {
                await sql`
                  UPDATE clients
                  SET status = 'active', paid_at = NOW(), onboarding_mp_payment_id = ${paymentId}
                  WHERE id = ${client.id}
                `;
                console.log(`[MP Webhook Onboarding] Client ${client.slug} activated`);
                return res.status(200).json({
                  success: true,
                  message: 'Onboarding payment approved - Client activated',
                  client_id: client.id,
                  slug: client.slug,
                });
              } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
                await sql`
                  UPDATE clients
                  SET status = 'payment_failed', onboarding_mp_payment_id = ${paymentId}
                  WHERE id = ${client.id}
                `;
                return res.status(200).json({ success: true, message: 'Onboarding payment rejected' });
              } else {
                await sql`UPDATE clients SET onboarding_mp_payment_id = ${paymentId} WHERE id = ${client.id}`;
                return res.status(200).json({ success: true, message: 'Onboarding payment pending' });
              }
            }
          }
        } catch {
          console.log('[MP Webhook] No es pago de onboarding, procesando como booking');
        }
      }

      // ── SEGUNDO: Lógica de BOOKINGS (turnos) ─────────────────────────────

      // Incluye cal_booking_id para matching y backward compat
      const pendingBookings = await sql`
        SELECT
          b.id,
          b.client_id,
          b.cal_booking_id,
          b.paciente_nombre,
          b.paciente_email,
          b.paciente_telefono,
          b.fecha_hora,
          b.notas,
          b.evento_id,
          b.mp_preference_id,
          b.mp_payment_id,
          b.google_event_id,
          b.estado
        FROM bookings b
        WHERE b.estado IN ('pending_payment', 'pending', 'paid')
        ORDER BY b.created_at DESC
        LIMIT 20
      `;

      if (pendingBookings.length === 0) {
        return res.status(200).json({ message: 'No pending bookings found' });
      }

      let payment = null;
      let bookingMatch = null;
      let clientData = null;

      for (const booking of pendingBookings) {
        try {
          // Incluye cal_api_key y google_refresh_token para bifurcar en calendar
          const clientResult = await sql`
            SELECT id, slug, email, especialidad, mp_access_token, nombre_completo, cal_api_key, google_refresh_token
            FROM clients
            WHERE id = ${booking.client_id}
            LIMIT 1
          `;

          if (clientResult.length === 0 || !clientResult[0].mp_access_token) continue;

          const client = clientResult[0];
          const accessToken = decrypt(client.mp_access_token);

          const paymentResponse = await axios.get(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );

          payment = paymentResponse.data;

          const matchByPreference =
            payment.preference_id && payment.preference_id === booking.mp_preference_id;
          const matchByReference =
            payment.external_reference &&
            (payment.external_reference === booking.id.toString() ||
              payment.external_reference === booking.cal_booking_id);

          if (matchByPreference || matchByReference) {
            bookingMatch = booking;
            clientData = client;
            break;
          }
        } catch {
          continue;
        }
      }

      if (!payment || !bookingMatch || !clientData) {
        return res.status(200).json({ message: 'Payment not matched to any booking' });
      }

      // Protección contra webhooks duplicados
      if (bookingMatch.mp_payment_id && bookingMatch.mp_payment_id === paymentId) {
        return res.status(200).json({
          success: true,
          message: 'Payment already processed (idempotent)',
          booking_id: bookingMatch.id,
          estado: bookingMatch.estado,
        });
      }

      if (payment.status === 'approved') {
        await sql`
          UPDATE bookings
          SET mp_payment_id = ${paymentId}, mp_payment_status = ${payment.status}, estado = 'paid', paid_at = NOW()
          WHERE id = ${bookingMatch.id}
        `;

        // ── Bifurcación calendar: Google Calendar (nuevo) vs Cal.com (legacy) ──
        if (clientData.google_refresh_token) {
          // NUEVO: cliente conectó Google Calendar directamente
          try {
            let duracion = 30;
            let modalidad: 'virtual' | 'presencial' = 'virtual';
            let eventoNombre = 'Consulta';

            if (bookingMatch.evento_id) {
              const eventoResult = await sql`
                SELECT nombre, duracion_minutos, modalidad FROM eventos WHERE id = ${bookingMatch.evento_id} LIMIT 1
              `;
              if (eventoResult.length > 0) {
                duracion = eventoResult[0].duracion_minutos || 30;
                modalidad = eventoResult[0].modalidad || 'virtual';
                eventoNombre = eventoResult[0].nombre || 'Consulta';
              }
            }

            const fechaInicio = new Date(bookingMatch.fecha_hora);
            const fechaFin = new Date(fechaInicio.getTime() + duracion * 60 * 1000);

            const gcEvent = await createEventForClient(bookingMatch.client_id, {
              booking_id: bookingMatch.id,
              titulo: `${eventoNombre} - ${bookingMatch.paciente_nombre}`,
              descripcion: 'Turno agendado vía e-bio-link',
              fecha_hora: fechaInicio.toISOString(),
              fecha_hora_fin: fechaFin.toISOString(),
              paciente_nombre: bookingMatch.paciente_nombre,
              paciente_email: bookingMatch.paciente_email,
              paciente_telefono: bookingMatch.paciente_telefono || '',
              modalidad,
              notas: bookingMatch.notas,
            });

            await sql`
              UPDATE bookings
              SET google_event_id = ${gcEvent.google_event_id}, meet_link = ${gcEvent.meet_link},
                  estado = 'confirmed', confirmed_at = NOW()
              WHERE id = ${bookingMatch.id}
            `;

            console.log(`[MP Webhook] Booking ${bookingMatch.id} confirmed via Google Calendar`);

            // Emails de confirmación (no bloquean si fallan)
            const emailData = {
              paciente_nombre: bookingMatch.paciente_nombre,
              paciente_email: bookingMatch.paciente_email,
              medico_nombre: clientData.nombre_completo,
              medico_especialidad: clientData.especialidad || undefined,
              fecha_hora: bookingMatch.fecha_hora,
              evento_nombre: eventoNombre,
              modalidad,
              meet_link: gcEvent.meet_link || null,
              monto: bookingMatch.monto,
            };
            await Promise.all([
              sendBookingConfirmation(emailData).catch((e) =>
                console.error('[Email] Error confirmación paciente:', e.message)
              ),
              clientData.email
                ? sendNewBookingNotification({
                    ...emailData,
                    medico_email: clientData.email,
                    paciente_telefono: bookingMatch.paciente_telefono || undefined,
                    notas: bookingMatch.notas || undefined,
                  }).catch((e) => console.error('[Email] Error notif profesional:', e.message))
                : Promise.resolve(),
            ]);

          } catch (gcError: any) {
            console.error('[MP Webhook] Error Google Calendar:', gcError.message);
            // Pago registrado; el profesional puede confirmar luego desde /api/confirmar-turno
          }

        } else if (clientData.cal_api_key && bookingMatch.cal_booking_id) {
          // LEGACY: cliente usa Cal.com
          try {
            await axios.post(
              `https://api.cal.com/v2/bookings/${bookingMatch.cal_booking_id}/confirm`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${clientData.cal_api_key}`,
                  'cal-api-version': '2024-08-13',
                },
              }
            );

            await sql`
              UPDATE bookings SET estado = 'confirmed', confirmed_at = NOW() WHERE id = ${bookingMatch.id}
            `;

            console.log(`[MP Webhook] Booking ${bookingMatch.id} confirmed via Cal.com (legacy)`);
          } catch (calError: any) {
            console.error('[MP Webhook] Error Cal.com confirm:', calError.response?.data || calError.message);
          }

        } else {
          console.warn(`[MP Webhook] Sin integración de calendario para cliente ${clientData.slug}`);
        }

        return res.status(200).json({ success: true, message: 'Pago procesado y turno confirmado' });

      } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
        await sql`
          UPDATE bookings
          SET mp_payment_id = ${paymentId}, mp_payment_status = ${payment.status}, estado = 'cancelled'
          WHERE id = ${bookingMatch.id}
        `;

        // Cancelar en el sistema correspondiente
        if (bookingMatch.google_event_id) {
          try { await deleteEventForClient(bookingMatch.client_id, bookingMatch.google_event_id); } catch { /* ignorar */ }
          // Email de cancelación solo para el flujo Google Calendar
          sendBookingCancellation({
            paciente_nombre: bookingMatch.paciente_nombre,
            paciente_email: bookingMatch.paciente_email,
            medico_nombre: clientData.nombre_completo,
            fecha_hora: bookingMatch.fecha_hora,
          }).catch((e) => console.error('[Email] Error cancelación:', e.message));
        } else if (clientData.cal_api_key && bookingMatch.cal_booking_id) {
          try {
            await axios.post(
              `https://api.cal.com/v2/bookings/${bookingMatch.cal_booking_id}/cancel`,
              { cancellationReason: 'Pago rechazado en Mercado Pago' },
              {
                headers: {
                  Authorization: `Bearer ${clientData.cal_api_key}`,
                  'cal-api-version': '2024-08-13',
                },
              }
            );
          } catch { /* ignorar */ }
        }

        return res.status(200).json({ success: true, message: 'Pago rechazado, booking cancelado' });

      } else {
        await sql`
          UPDATE bookings SET mp_payment_id = ${paymentId}, mp_payment_status = ${payment.status}
          WHERE id = ${bookingMatch.id}
        `;
        return res.status(200).json({ success: true, message: 'Payment status updated' });
      }
    }

    return res.status(200).json({ success: true, message: 'Notification received' });
  } catch (error: any) {
    console.error('Error processing Mercado Pago webhook:', error);
    if (axios.isAxiosError(error)) {
      console.error('Mercado Pago API error:', error.response?.data);
    }
    // Siempre 200 para que MP no reintente
    return res.status(200).json({ error: 'Error processed', logged: true });
  }
}
