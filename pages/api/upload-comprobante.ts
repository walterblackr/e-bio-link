// API endpoint para subir comprobante de transferencia bancaria a Cloudinary
// Luego de subir, notifica al médico con magic links para confirmar/rechazar
import type { NextApiRequest, NextApiResponse } from 'next';
import { v2 as cloudinary } from 'cloudinary';
import formidable from 'formidable';
import fs from 'fs';
import { neon } from '@neondatabase/serverless';
import { generateActionToken } from '../../lib/booking-token';
import { sendComprobanteNotification } from '../../lib/email';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://ebiolink.app';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({ maxFileSize: 10 * 1024 * 1024 }); // 10MB

  try {
    const [fields, files] = await form.parse(req);

    const booking_id = Array.isArray(fields.booking_id)
      ? fields.booking_id[0]
      : fields.booking_id;

    if (!booking_id) {
      return res.status(400).json({ error: 'booking_id requerido' });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ error: 'Archivo requerido' });
    }

    // Subir a Cloudinary
    const uploadResult = await cloudinary.uploader.upload(file.filepath, {
      folder: 'e-bio-link/comprobantes',
      resource_type: 'auto',
      public_id: `booking-${booking_id}-${Date.now()}`,
    });

    // Limpiar archivo temporal
    fs.unlinkSync(file.filepath);

    const sql = neon(process.env.DATABASE_URL!);

    // Obtener booking con datos completos
    const bookingResult = await sql`
      SELECT
        b.id, b.client_id, b.evento_id, b.paciente_nombre, b.paciente_email,
        b.paciente_telefono, b.fecha_hora, b.monto, b.notas, b.estado, b.expires_at,
        c.slug as client_slug
      FROM bookings b
      JOIN clients c ON c.id = b.client_id
      WHERE b.id = ${booking_id}
      LIMIT 1
    `;

    if (bookingResult.length === 0) {
      return res.status(404).json({ error: 'Booking no encontrado' });
    }

    const booking = bookingResult[0];

    // Validar que la reserva siga vigente (no vencida ni en otro estado)
    if (booking.estado !== 'pending_payment') {
      return res.status(410).json({
        error: 'Esta reserva ya no está pendiente de pago',
        slug: booking.client_slug,
      });
    }
    if (booking.expires_at && new Date(booking.expires_at) <= new Date()) {
      return res.status(410).json({
        error: 'Tu reserva venció — podés reservar de nuevo',
        slug: booking.client_slug,
      });
    }

    // Obtener datos del profesional
    const clientResult = await sql`
      SELECT id, nombre_completo, especialidad, email
      FROM clients
      WHERE id = ${booking.client_id}
      LIMIT 1
    `;
    const clientInfo = clientResult[0];

    // Obtener datos del evento
    let eventoNombre = 'Consulta';
    let eventoCobro_tipo: 'total' | 'sena' = 'total';
    let eventoSena_monto: number | null = null;
    let eventoPrecio: number | null = null;
    let eventoDireccion: string | null = null;
    if (booking.evento_id) {
      const eventoResult = await sql`
        SELECT nombre, cobro_tipo, sena_monto, precio, direccion FROM eventos WHERE id = ${booking.evento_id} LIMIT 1
      `;
      if (eventoResult.length > 0) {
        eventoNombre = eventoResult[0].nombre || 'Consulta';
        eventoCobro_tipo = eventoResult[0].cobro_tipo || 'total';
        eventoSena_monto = eventoResult[0].sena_monto ? Number(eventoResult[0].sena_monto) : null;
        eventoPrecio = Number(eventoResult[0].precio);
        eventoDireccion = eventoResult[0].direccion || null;
      }
    }

    // Guardar comprobante y marcar como pending_confirmation
    await sql`
      UPDATE bookings
      SET comprobante_url = ${uploadResult.secure_url}, estado = 'pending_confirmation'
      WHERE id = ${booking_id}
    `;

    console.log(`[upload-comprobante] Booking ${booking_id} → pending_confirmation. Comprobante: ${uploadResult.secure_url}`);

    // Generar magic links firmados (con timestamp para expiración de 7 días)
    const { token: confirmToken, ts: confirmTs } = generateActionToken(booking_id, 'confirm');
    const { token: rejectToken, ts: rejectTs } = generateActionToken(booking_id, 'reject');

    const confirmUrl = `${BASE_URL}/api/accion-turno?booking_id=${booking_id}&action=confirm&ts=${confirmTs}&token=${confirmToken}`;
    const rejectUrl = `${BASE_URL}/api/accion-turno?booking_id=${booking_id}&action=reject&ts=${rejectTs}&token=${rejectToken}`;

    // Enviar email al médico con los botones confirmar/rechazar
    if (clientInfo?.email) {
      await sendComprobanteNotification({
        medico_email: clientInfo.email,
        medico_nombre: clientInfo.nombre_completo || '',
        paciente_nombre: booking.paciente_nombre,
        paciente_email: booking.paciente_email,
        paciente_telefono: booking.paciente_telefono || undefined,
        fecha_hora: booking.fecha_hora,
        evento_nombre: eventoNombre,
        monto: booking.monto,
        comprobante_url: uploadResult.secure_url,
        confirm_url: confirmUrl,
        reject_url: rejectUrl,
        cobro_tipo: eventoCobro_tipo,
        precio_total: eventoCobro_tipo === 'sena' && eventoSena_monto && eventoPrecio
          ? eventoPrecio - eventoSena_monto
          : undefined,
        direccion: eventoDireccion,
      }).catch((e) => console.error('[Email] Error notif comprobante:', e.message));
    } else {
      console.warn(`[upload-comprobante] Profesional sin email para booking ${booking_id}`);
    }

    return res.status(200).json({
      success: true,
      comprobante_url: uploadResult.secure_url,
    });
  } catch (error: any) {
    console.error('Error uploading comprobante:', error);
    return res.status(500).json({ error: 'Error al subir el comprobante' });
  }
}
