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

      // 1. Buscar bookings pendientes (sin JOIN, más simple)
      const pendingBookings = await sql`
        SELECT id, client_slug, cal_booking_id, mp_preference_id
        FROM bookings
        WHERE estado IN ('pending', 'paid')
        ORDER BY created_at DESC
        LIMIT 20
      `;

      console.log(`[MP Webhook] Buscando entre ${pendingBookings.length} bookings pendientes`);

      if (pendingBookings.length === 0) {
        console.log('[MP Webhook] No hay bookings pendientes');
        return res.status(200).json({ message: 'No pending bookings found' });
      }

      // 2. Intentar obtener el pago con cada cliente hasta encontrar el correcto
      let payment = null;
      let bookingMatch = null;
      let clientData = null;

      for (const booking of pendingBookings) {
        try {
          // Obtener datos del cliente para este booking (igual que en crear-preferencia-pago)
          const clientResult = await sql`
            SELECT slug, mp_access_token, cal_api_key, nombre_completo
            FROM clients
            WHERE slug = ${booking.client_slug}
            LIMIT 1
          `;

          if (clientResult.length === 0 || !clientResult[0].mp_access_token) {
            continue;
          }

          const client = clientResult[0];
          const accessToken = decrypt(client.mp_access_token);

          // Intentar obtener el pago con este access token
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
          const matchByPreference = payment.preference_id && payment.preference_id === booking.mp_preference_id;
          const matchByReference = payment.external_reference && payment.external_reference === booking.cal_booking_id;

          if (matchByPreference || matchByReference) {
            console.log(`[MP Webhook] ✓ Match encontrado con booking ${booking.id} (${matchByPreference ? 'por preference_id' : 'por external_reference'})`);
            bookingMatch = booking;
            clientData = client;
            console.log(`[MP Webhook] Cliente: ${client.slug}, cal_api_key presente: ${!!client.cal_api_key}`);
            break;
          } else {
            console.log(`[MP Webhook] ✗ No match - preference_id del pago (${payment.preference_id}) != booking (${booking.mp_preference_id})`);
          }
        } catch (error: any) {
          console.log(`[MP Webhook] Error consultando pago con booking ${booking.id}:`, error.response?.status || error.message);
          continue;
        }
      }

      if (!payment || !bookingMatch || !clientData) {
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
        console.log(`  - cal_api_key: "${clientData.cal_api_key}" (length: ${clientData.cal_api_key?.length || 0})`);
        console.log(`  - cal_booking_id: "${bookingMatch.cal_booking_id}"`);

        if (clientData.cal_api_key && bookingMatch.cal_booking_id) {
          try {
            console.log(`[MP Webhook] Confirmando turno en Cal.com - Booking UID: ${bookingMatch.cal_booking_id}`);

            // Cal.com API v2: Confirmar booking usando el endpoint específico
            // POST /v2/bookings/{bookingUid}/confirm
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
          console.warn(`[MP Webhook] No se puede confirmar en Cal.com - API Key: ${!!clientData.cal_api_key}, Booking ID: ${!!bookingMatch.cal_booking_id}`);
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
        if (clientData.cal_api_key && bookingMatch.cal_booking_id) {
          try {
            // Cal.com API v1 usa apiKey como query parameter
            await axios.delete(
              `https://api.cal.com/v1/bookings/${bookingMatch.cal_booking_id}?apiKey=${clientData.cal_api_key}`
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
