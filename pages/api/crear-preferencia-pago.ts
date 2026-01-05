// API para crear preferencia de pago en Mercado Pago
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
    const {
      client_slug,
      paciente_nombre,
      paciente_email,
      paciente_telefono,
      fecha_hora,
      monto,
      cal_booking_id,
    } = req.body;

    // Validaciones
    if (!client_slug || !paciente_nombre || !paciente_email || !fecha_hora || !monto) {
      return res.status(400).json({
        error: 'Faltan campos requeridos: client_slug, paciente_nombre, paciente_email, fecha_hora, monto',
      });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // 1. Buscar el cliente y sus tokens de Mercado Pago
    const clientResult = await sql`
      SELECT
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

    // Verificar que tenga Mercado Pago conectado
    if (!client.mp_access_token || !client.mp_user_id) {
      return res.status(400).json({
        error: 'Este profesional no tiene Mercado Pago configurado',
      });
    }

    // 2. Desencriptar el access token
    const accessToken = decrypt(client.mp_access_token);

    // 3. Crear la preferencia de pago en Mercado Pago
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
          phone: {
            number: paciente_telefono,
          },
        }),
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL || 'https://e-bio-link.vercel.app'}/pago-exitoso?slug=${client_slug}`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL || 'https://e-bio-link.vercel.app'}/biolink/${client_slug}`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL || 'https://e-bio-link.vercel.app'}/pago-pendiente?slug=${client_slug}`,
      },
      auto_return: 'approved',
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://e-bio-link.vercel.app'}/api/webhooks/mercadopago`,
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

    // 4. Guardar el booking en la base de datos
    const bookingResult = await sql`
      INSERT INTO bookings (
        client_slug,
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
        ${client_slug},
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

    // 5. Retornar la URL de pago
    return res.status(200).json({
      success: true,
      booking_id: bookingId,
      preference_id: preference.id,
      init_point: preference.init_point, // URL para desktop
      sandbox_init_point: preference.sandbox_init_point, // URL para testing
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
