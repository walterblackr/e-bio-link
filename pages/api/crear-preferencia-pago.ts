// API para crear preferencia de pago en Mercado Pago
// Soporta dos flujos:
//   NUEVO: { booking_id, client_slug } — usa booking existente (creado por /api/reservar)
//   LEGACY: { client_slug, cal_booking_id, paciente_nombre, paciente_email, fecha_hora, monto } — crea booking nuevo (Cal.com)
import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { decrypt } from '../../lib/encryption';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://e-bio-link.vercel.app';

    // ── NUEVO FLUJO: tiene booking_id ──────────────────────────────────────
    if (req.body.booking_id) {
      const { booking_id, client_slug } = req.body;

      if (!client_slug) {
        return res.status(400).json({ error: 'Falta client_slug' });
      }

      const bookingResult = await sql`
        SELECT
          b.id,
          b.paciente_nombre,
          b.paciente_email,
          b.paciente_telefono,
          b.fecha_hora,
          b.monto,
          b.estado,
          c.id as client_id,
          c.slug,
          c.nombre_completo,
          c.mp_access_token,
          c.mp_user_id
        FROM bookings b
        JOIN clients c ON c.id = b.client_id
        WHERE b.id = ${booking_id}
          AND c.slug = ${client_slug}
        LIMIT 1
      `;

      if (bookingResult.length === 0) {
        return res.status(404).json({ error: 'Booking no encontrado' });
      }

      const booking = bookingResult[0];

      if (booking.estado !== 'pending_payment' && booking.estado !== 'pending') {
        return res.status(400).json({
          error: `El booking tiene estado '${booking.estado}', no se puede crear preferencia de pago`,
        });
      }

      if (!booking.mp_access_token || !booking.mp_user_id) {
        return res.status(400).json({
          error: 'Este profesional no tiene Mercado Pago configurado',
        });
      }

      const accessToken = decrypt(booking.mp_access_token);

      const preferenceData = {
        items: [
          {
            title: `Consulta con ${booking.nombre_completo}`,
            description: `Turno para ${new Date(booking.fecha_hora).toLocaleString('es-AR', {
              dateStyle: 'long',
              timeStyle: 'short',
            })}`,
            quantity: 1,
            unit_price: parseFloat(booking.monto),
            currency_id: 'ARS',
          },
        ],
        payer: {
          name: booking.paciente_nombre,
          email: booking.paciente_email,
          ...(booking.paciente_telefono && {
            phone: { number: booking.paciente_telefono },
          }),
        },
        back_urls: {
          success: `${baseUrl}/pago-exitoso?slug=${client_slug}&booking_id=${booking_id}`,
          failure: `${baseUrl}/biolink/${client_slug}`,
          pending: `${baseUrl}/pago-pendiente?slug=${client_slug}&booking_id=${booking_id}`,
        },
        auto_return: 'approved',
        notification_url: `${baseUrl}/api/webhooks/mercadopago`,
        external_reference: booking_id.toString(),
        statement_descriptor: booking.nombre_completo.substring(0, 22),
      };

      const mpResponse = await axios.post(
        'https://api.mercadopago.com/checkout/preferences',
        preferenceData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const preference = mpResponse.data;

      await sql`
        UPDATE bookings
        SET mp_preference_id = ${preference.id}
        WHERE id = ${booking_id}
      `;

      return res.status(200).json({
        success: true,
        booking_id,
        preference_id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
      });
    }

    // ── FLUJO LEGACY: cal_booking_id (clientes Cal.com) ────────────────────
    const {
      client_slug,
      paciente_nombre,
      paciente_email,
      paciente_telefono,
      fecha_hora,
      monto,
      cal_booking_id,
    } = req.body;

    if (!client_slug || !paciente_nombre || !paciente_email || !fecha_hora || !monto) {
      return res.status(400).json({
        error: 'Faltan campos requeridos: client_slug, paciente_nombre, paciente_email, fecha_hora, monto',
      });
    }

    const clientResult = await sql`
      SELECT
        id,
        slug,
        nombre_completo,
        mp_access_token,
        mp_user_id
      FROM clients
      WHERE slug = ${client_slug}
      LIMIT 1
    `;

    if (clientResult.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const client = clientResult[0];

    if (!client.mp_access_token || !client.mp_user_id) {
      return res.status(400).json({
        error: 'Este profesional no tiene Mercado Pago configurado',
      });
    }

    const accessToken = decrypt(client.mp_access_token);

    const preferenceData = {
      items: [
        {
          title: `Consulta con ${client.nombre_completo}`,
          description: `Turno para ${new Date(fecha_hora).toLocaleString('es-AR', {
            dateStyle: 'long',
            timeStyle: 'short',
          })}`,
          quantity: 1,
          unit_price: parseFloat(monto),
          currency_id: 'ARS',
        },
      ],
      payer: {
        name: paciente_nombre,
        email: paciente_email,
        ...(paciente_telefono && {
          phone: { number: paciente_telefono },
        }),
      },
      back_urls: {
        success: `${baseUrl}/pago-exitoso?slug=${client_slug}`,
        failure: `${baseUrl}/biolink/${client_slug}`,
        pending: `${baseUrl}/pago-pendiente?slug=${client_slug}`,
      },
      auto_return: 'approved',
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      external_reference: cal_booking_id || `booking_${Date.now()}`,
      statement_descriptor: client.nombre_completo.substring(0, 22),
    };

    const mpResponse = await axios.post(
      'https://api.mercadopago.com/checkout/preferences',
      preferenceData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const preference = mpResponse.data;

    // Flujo legacy: crear el booking en este punto (como antes)
    const bookingResult = await sql`
      INSERT INTO bookings (
        client_id,
        cal_booking_id,
        paciente_nombre,
        paciente_email,
        paciente_telefono,
        fecha_hora,
        monto,
        mp_preference_id,
        estado
      )
      VALUES (
        ${client.id},
        ${cal_booking_id || null},
        ${paciente_nombre},
        ${paciente_email},
        ${paciente_telefono || null},
        ${fecha_hora},
        ${monto},
        ${preference.id},
        'pending'
      )
      RETURNING id
    `;

    const bookingId = bookingResult[0].id;

    return res.status(200).json({
      success: true,
      booking_id: bookingId,
      preference_id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
    });
  } catch (error: any) {
    console.error('Error creating payment preference:', error);

    if (axios.isAxiosError(error)) {
      console.error('Mercado Pago error:', error.response?.data);
      return res.status(500).json({
        error: 'Error al crear preferencia de pago en Mercado Pago',
        details: error.response?.data,
      });
    }

    return res.status(500).json({
      error: 'Error al procesar la solicitud de pago',
    });
  }
}
