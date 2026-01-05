// Webhook para recibir notificaciones de pagos de Mercado Pago
import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { decrypt } from '../../../lib/encryption';
import axios from 'axios';
import crypto from 'crypto';

// Función para validar la firma del webhook de Mercado Pago
function validateMercadoPagoSignature(
  xSignature: string | undefined,
  xRequestId: string | undefined,
  dataId: string,
  secret: string
): boolean {
  if (!xSignature || !xRequestId) {
    return false;
  }

  // Mercado Pago envía la firma en formato: ts=timestamp,v1=hash
  const parts = xSignature.split(',');
  const tsMatch = parts.find((part) => part.startsWith('ts='));
  const hashMatch = parts.find((part) => part.startsWith('v1='));

  if (!tsMatch || !hashMatch) {
    return false;
  }

  const ts = tsMatch.replace('ts=', '');
  const receivedHash = hashMatch.replace('v1=', '');

  // Crear el manifest que MP usa para firmar: id + request-id + ts
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  // Generar HMAC SHA256
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(manifest);
  const calculatedHash = hmac.digest('hex');

  return calculatedHash === receivedHash;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Mercado Pago envía GET para verificar que el endpoint existe
  if (req.method === 'GET') {
    return res.status(200).send('Webhook de Mercado Pago activo');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Mercado Pago puede enviar en diferentes formatos
    // Formato 1: { type: "payment", data: { id: "123" } }
    // Formato 2: { action: "payment.created", data: { id: "123" } }
    // Formato 3: Query params ?topic=payment&id=123

    const topic = req.query.topic || req.body?.type || req.body?.action?.split('.')[0];
    const resourceId = req.query.id || req.body?.data?.id || req.body?.id;

    console.log(`[MP Webhook] Body completo:`, JSON.stringify(req.body));
    console.log(`[MP Webhook] Query params:`, JSON.stringify(req.query));
    console.log(`[MP Webhook] Recibido: topic=${topic}, resourceId=${resourceId}`);

    // Validar firma del webhook si tenemos el secret configurado
    if (process.env.MERCADOPAGO_WEBHOOK_SECRET) {
      const xSignature = req.headers['x-signature'] as string | undefined;
      const xRequestId = req.headers['x-request-id'] as string | undefined;

      console.log(`[MP Webhook] Validando firma - Signature: ${xSignature ? 'presente' : 'ausente'}, RequestId: ${xRequestId ? 'presente' : 'ausente'}`);

      const isValid = validateMercadoPagoSignature(
        xSignature,
        xRequestId,
        resourceId,
        process.env.MERCADOPAGO_WEBHOOK_SECRET
      );

      if (!isValid) {
        console.error('[MP Webhook] ADVERTENCIA: Firma inválida - procesando de todas formas para debugging');
        // Temporalmente no rechazamos el webhook para debugging
        // TODO: Descomentar esto en producción
        // return res.status(401).json({ error: 'Invalid signature' });
      } else {
        console.log('[MP Webhook] Firma válida');
      }
    } else {
      console.log('[MP Webhook] No hay MERCADOPAGO_WEBHOOK_SECRET configurado - saltando validación');
    }

    // Mercado Pago puede enviar varios tipos de notificaciones
    // Nos interesa: payment
    if (topic === 'payment') {
      const paymentId = resourceId;

      if (!paymentId) {
        console.log('[MP Webhook] No payment ID encontrado');
        return res.status(400).json({ error: 'No payment ID received' });
      }

      console.log(`[MP Webhook] Procesando payment ID: ${paymentId}`);

      const sql = neon(process.env.DATABASE_URL!);

      // Buscar todos los bookings pendientes o en proceso
      // Necesitamos obtener el access token para consultar el pago
      const pendingBookings = await sql`
        SELECT
          b.id,
          b.client_slug,
          b.cal_booking_id,
          b.mp_preference_id,
          c.mp_access_token,
          c.cal_api_key,
          c.nombre_completo
        FROM bookings b
        JOIN clients c ON b.client_slug = c.slug
        WHERE b.estado IN ('pending', 'paid')
          AND c.mp_access_token IS NOT NULL
          AND c.mp_access_token != ''
        ORDER BY b.created_at DESC
        LIMIT 20
      `;

      console.log(`[MP Webhook] Buscando entre ${pendingBookings.length} bookings pendientes`);

      // Debug: mostrar el primer booking completo para ver qué campos tiene
      if (pendingBookings.length > 0) {
        console.log(`[MP Webhook] DEBUG - Primer booking encontrado:`, JSON.stringify(pendingBookings[0], null, 2));
        console.log(`[MP Webhook] DEBUG - Claves del objeto:`, Object.keys(pendingBookings[0]));
      }

      if (pendingBookings.length === 0) {
        console.log('[MP Webhook] No hay bookings pendientes');
        return res.status(200).json({ message: 'No pending bookings found' });
      }

      // Intentar con cada token hasta encontrar el pago
      let payment = null;
      let bookingMatch = null;

      for (const booking of pendingBookings) {
        console.log(`[MP Webhook] Probando con booking ${booking.id} - preference_id: ${booking.mp_preference_id}`);
        try {
          const accessToken = decrypt(booking.mp_access_token);

          const paymentResponse = await axios.get(
            `https://api.mercadopago.com/v1/payments/${paymentId}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          payment = paymentResponse.data;

          console.log(`[MP Webhook] Pago obtenido - preference_id: ${payment.preference_id}, external_reference: ${payment.external_reference}`);

          // Verificar si este pago corresponde a este booking
          // Intentar match por preference_id O por external_reference (cal_booking_id)
          const matchByPreference = payment.preference_id && payment.preference_id === booking.mp_preference_id;
          const matchByReference = payment.external_reference && payment.external_reference === booking.cal_booking_id;

          if (matchByPreference || matchByReference) {
            console.log(`[MP Webhook] ✓ Match encontrado con booking ${booking.id} (${matchByPreference ? 'por preference_id' : 'por external_reference'})`);
            bookingMatch = booking;
            console.log(`[MP Webhook] DEBUG - bookingMatch completo:`, JSON.stringify(bookingMatch, null, 2));
            console.log(`[MP Webhook] DEBUG - Claves de bookingMatch:`, Object.keys(bookingMatch));
            break;
          } else {
            console.log(`[MP Webhook] ✗ No match - preference_id del pago (${payment.preference_id}) != booking (${booking.mp_preference_id}), external_reference (${payment.external_reference}) != cal_booking_id (${booking.cal_booking_id})`);
          }
        } catch (error: any) {
          console.log(`[MP Webhook] Error consultando pago con booking ${booking.id}:`, error.response?.status || error.message);
          // Token inválido o pago no pertenece a este vendedor, continuar
          continue;
        }
      }

      if (!payment || !bookingMatch) {
        console.log('[MP Webhook] No se encontró match para este pago');
        return res.status(200).json({ message: 'Payment not matched to any booking' });
      }

      console.log(`[MP Webhook] Procesando pago - Status: ${payment.status}, Booking ID: ${bookingMatch.id}`);

      // Actualizar el booking con el estado del pago
      if (payment.status === 'approved') {
        // Pago aprobado
        await sql`
          UPDATE bookings
          SET
            mp_payment_id = ${paymentId},
            mp_payment_status = ${payment.status},
            estado = 'paid',
            paid_at = NOW()
          WHERE id = ${bookingMatch.id}
        `;

        // Confirmar el turno en Cal.com si tiene API key y booking ID
        console.log(`[MP Webhook] Verificando datos para Cal.com:`);
        console.log(`  - cal_api_key: "${bookingMatch.cal_api_key}" (length: ${bookingMatch.cal_api_key?.length || 0})`);
        console.log(`  - cal_booking_id: "${bookingMatch.cal_booking_id}"`);

        if (bookingMatch.cal_api_key && bookingMatch.cal_booking_id) {
          try {
            console.log(`[MP Webhook] Confirmando turno en Cal.com - Booking ID: ${bookingMatch.cal_booking_id}`);

            await axios.patch(
              `https://api.cal.com/v1/bookings/${bookingMatch.cal_booking_id}`,
              {
                status: 'ACCEPTED',
              },
              {
                headers: {
                  'cal-api-version': '2024-08-13',
                  Authorization: `Bearer ${bookingMatch.cal_api_key}`,
                },
              }
            );

            console.log(`[MP Webhook] Turno confirmado exitosamente en Cal.com`);

            await sql`
              UPDATE bookings
              SET
                estado = 'confirmed',
                confirmed_at = NOW()
              WHERE id = ${bookingMatch.id}
            `;
          } catch (calError: any) {
            console.error('[MP Webhook] Error confirming in Cal.com:', calError.response?.data || calError.message);
            // No fallar el webhook por esto, el pago ya fue registrado
          }
        } else {
          console.warn(`[MP Webhook] No se puede confirmar en Cal.com - API Key: ${!!bookingMatch.cal_api_key}, Booking ID: ${!!bookingMatch.cal_booking_id}`);
        }

        return res.status(200).json({
          success: true,
          message: 'Pago procesado y turno confirmado',
        });
      } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
        // Pago rechazado o cancelado
        await sql`
          UPDATE bookings
          SET
            mp_payment_id = ${paymentId},
            mp_payment_status = ${payment.status},
            estado = 'cancelled'
          WHERE id = ${bookingMatch.id}
        `;

        // Cancelar en Cal.com si es necesario
        if (bookingMatch.cal_api_key && bookingMatch.cal_booking_id) {
          try {
            await axios.delete(
              `https://api.cal.com/v1/bookings/${bookingMatch.cal_booking_id}`,
              {
                headers: {
                  'cal-api-version': '2024-08-13',
                  Authorization: `Bearer ${bookingMatch.cal_api_key}`,
                },
              }
            );
          } catch {
            // Ignorar error
          }
        }

        return res.status(200).json({
          success: true,
          message: 'Pago rechazado, booking cancelado',
        });
      } else {
        // Otro estado (pending, in_process, etc.)
        await sql`
          UPDATE bookings
          SET
            mp_payment_id = ${paymentId},
            mp_payment_status = ${payment.status}
          WHERE id = ${bookingMatch.id}
        `;

        return res.status(200).json({
          success: true,
          message: 'Payment status updated',
        });
      }
    }

    // Para otros tipos de notificaciones
    console.log(`[MP Webhook] Tipo de notificación no manejado: ${topic}`);
    return res.status(200).json({ success: true, message: 'Notification received' });
  } catch (error: any) {
    console.error('Error processing Mercado Pago webhook:', error);

    if (axios.isAxiosError(error)) {
      console.error('Mercado Pago API error:', error.response?.data);
    }

    // IMPORTANTE: Siempre retornar 200 para que Mercado Pago no reintente
    return res.status(200).json({ error: 'Error processed', logged: true });
  }
}
