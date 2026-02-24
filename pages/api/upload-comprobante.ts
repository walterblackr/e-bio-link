// API endpoint para subir comprobante de transferencia bancaria a Cloudinary
import type { NextApiRequest, NextApiResponse } from 'next';
import { v2 as cloudinary } from 'cloudinary';
import formidable from 'formidable';
import fs from 'fs';
import { neon } from '@neondatabase/serverless';

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

    // Verificar que el booking existe
    const bookingCheck = await sql`
      SELECT id, estado FROM bookings WHERE id = ${booking_id} LIMIT 1
    `;

    if (bookingCheck.length === 0) {
      return res.status(404).json({ error: 'Booking no encontrado' });
    }

    // Actualizar booking con URL del comprobante
    await sql`
      UPDATE bookings
      SET
        comprobante_url = ${uploadResult.secure_url},
        estado = 'pending_confirmation'
      WHERE id = ${booking_id}
    `;

    return res.status(200).json({
      success: true,
      comprobante_url: uploadResult.secure_url,
    });
  } catch (error: any) {
    console.error('Error uploading comprobante:', error);
    return res.status(500).json({ error: 'Error al subir el comprobante' });
  }
}
