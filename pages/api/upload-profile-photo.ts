// API endpoint para subir fotos de perfil a Cloudinary
import type { NextApiRequest, NextApiResponse } from 'next';
import { v2 as cloudinary } from 'cloudinary';
import formidable from 'formidable';
import fs from 'fs';
import { neon } from '@neondatabase/serverless';

// Validar sesión de admin
async function validateAdminSession(req: NextApiRequest): Promise<boolean> {
  const sessionCookie = req.cookies.admin_session;
  if (!sessionCookie) return false;

  try {
    // Parsear el JSON de la sesión
    const session = JSON.parse(sessionCookie);

    // Verificar que tenga los campos necesarios
    if (!session.id || !session.email) {
      return false;
    }

    // Verificar que el admin exista y esté activo
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`
      SELECT id FROM admins WHERE id = ${session.id} AND activo = true LIMIT 1
    `;

    return result.length > 0;
  } catch {
    return false;
  }
}

// Verificar que las variables de entorno estén configuradas
if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET) {
  console.error('Missing Cloudinary environment variables');
}

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Deshabilitar el body parser de Next.js para formidable
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

  // Validar autenticación de admin
  const isAuthenticated = await validateAdminSession(req);
  if (!isAuthenticated) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  // Verificar configuración de Cloudinary
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET) {
    return res.status(500).json({
      error: 'Cloudinary not configured',
      message: 'Please add CLOUDINARY environment variables in Vercel'
    });
  }

  try {
    // Parsear el form data con formidable
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB máximo
      filter: ({ mimetype }) => {
        // Solo permitir imágenes
        return mimetype?.includes('image') || false;
      },
    });

    const [, files] = await form.parse(req);

    // Obtener el archivo subido
    const file = files.file?.[0];

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype || '')) {
      return res.status(400).json({
        error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.'
      });
    }

    // Subir a Cloudinary
    const result = await cloudinary.uploader.upload(file.filepath, {
      folder: 'e-bio-link/profiles', // Carpeta en Cloudinary
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' }, // Crop centrado en la cara
        { quality: 'auto:good' }, // Optimización automática
        { fetch_format: 'auto' }, // Formato automático (WebP si el navegador lo soporta)
      ],
      public_id: `profile-${Date.now()}`, // ID único
    });

    // Eliminar archivo temporal
    fs.unlinkSync(file.filepath);

    // Devolver la URL de Cloudinary
    return res.status(200).json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error: any) {
    console.error('Error uploading to Cloudinary:', error);
    return res.status(500).json({
      error: 'Failed to upload image',
      details: error.message
    });
  }
}
