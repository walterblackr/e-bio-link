// pages/api/register.ts
// Registro de cliente + generación de preferencia de pago en Mercado Pago

import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';
import { hashPassword } from '../../lib/auth/client-auth';
import axios from 'axios';

const PLAN_PRICES = {
  monthly:   { price: 19990,  title: 'Suscripción Mensual',   duration: '1 mes' },
  semestral: { price: 80000,  title: 'Suscripción Semestral', duration: '6 meses' },
  annual:    { price: 120000, title: 'Suscripción Anual',      duration: '12 meses' },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, slug, plan } = req.body;

    // Validaciones
    if (!email || !password || !slug || !plan) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    if (!PLAN_PRICES[plan as keyof typeof PLAN_PRICES]) {
      return res.status(400).json({ error: 'Plan inválido' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    // Validar contraseña (mínimo 6 caracteres)
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Validar slug
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug) || slug.length < 3 || slug.length > 50) {
      return res.status(400).json({ error: 'Slug inválido' });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Verificar email: solo bloquear si la cuenta ya está activa
    const emailCheck = await sql`
      SELECT id, status, created_at FROM clients WHERE email = ${email} LIMIT 1
    `;

    if (emailCheck.length > 0) {
      if (emailCheck[0].status === 'active') {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }
      // pending_payment: si es reciente (< 20 min) puede haber un pago en curso
      const minutesOld = (Date.now() - new Date(emailCheck[0].created_at).getTime()) / 60000;
      if (minutesOld < 20) {
        return res.status(400).json({
          error: 'Ya iniciaste un registro hace menos de 20 minutos. Si pagaste, verificá el estado de tu pago.',
          client_id: emailCheck[0].id,
          check_payment: true,
        });
      }
      // Registro viejo sin pago → eliminar y permitir nuevo intento
      await sql`DELETE FROM clients WHERE id = ${emailCheck[0].id}`;
    }

    // Verificar slug: solo bloquear si la cuenta ya está activa o si hay un pago reciente en curso
    const slugCheck = await sql`
      SELECT id, status, created_at FROM clients WHERE slug = ${slug} LIMIT 1
    `;

    if (slugCheck.length > 0) {
      if (slugCheck[0].status === 'active') {
        return res.status(400).json({ error: 'Esta URL ya está en uso' });
      }
      const minutesOld = (Date.now() - new Date(slugCheck[0].created_at).getTime()) / 60000;
      if (minutesOld < 20) {
        return res.status(400).json({ error: 'Esta URL está siendo usada por otro registro en curso.' });
      }
      // Registro viejo sin pago → liberar el slug
      await sql`DELETE FROM clients WHERE id = ${slugCheck[0].id}`;
    }

    // Hash de la contraseña
    const password_hash = await hashPassword(password);

    const planDetails = PLAN_PRICES[plan as keyof typeof PLAN_PRICES];

    // Crear el cliente con status pending_payment
    const clientResult = await sql`
      INSERT INTO clients (
        email,
        password_hash,
        slug,
        status,
        subscription_type,
        subscription_price,
        mp_access_token,
        mp_user_id
      )
      VALUES (
        ${email},
        ${password_hash},
        ${slug},
        'pending_payment',
        ${plan},
        ${planDetails.price},
        '',
        ''
      )
      RETURNING id, email, slug
    `;

    const client = clientResult[0];

    // Generar preferencia de pago en Mercado Pago
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN no configurado');
    }

    const preference = {
      items: [
        {
          title: `${planDetails.title} - ${planDetails.duration}`,
          description: `Suscripción a plataforma de gestión de turnos`,
          quantity: 1,
          currency_id: 'ARS',
          unit_price: planDetails.price,
        },
      ],
      payer: {
        email: email,
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL}/success?client_id=${client.id}`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL}/register?plan=${plan}&error=payment_failed`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL}/success?client_id=${client.id}`,
      },
      auto_return: 'approved',
      external_reference: client.id, // UUID del cliente
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mercadopago`,
    };

    const mpResponse = await axios.post(
      'https://api.mercadopago.com/checkout/preferences',
      preference,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const preferenceId = mpResponse.data.id;
    const initPoint = mpResponse.data.init_point;

    // Guardar preference_id en el cliente
    await sql`
      UPDATE clients
      SET onboarding_mp_preference_id = ${preferenceId}
      WHERE id = ${client.id}
    `;

    return res.status(200).json({
      success: true,
      client_id: client.id,
      slug: client.slug,
      init_point: initPoint,
      preference_id: preferenceId,
    });
  } catch (error: any) {
    console.error('Error en registro:', error);

    if (axios.isAxiosError(error)) {
      console.error('Error de Mercado Pago:', error.response?.data);
      return res.status(500).json({ error: 'Error al generar el pago en Mercado Pago' });
    }

    return res.status(500).json({ error: 'Error al procesar el registro' });
  }
}
