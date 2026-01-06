// API endpoint para subir fotos de perfil a Cloudinary
import type { NextApiRequest, NextApiResponse } from 'next';
import { v2 as cloudinary } from 'cloudinary';
import formidable from 'formidable';
import fs from 'fs';

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
    console.log('Starting file upload process...');
    console.log('Cloudinary config check:', {
      hasCloudName: !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      hasApiKey: !!process.env.CLOUDINARY_API_KEY,
      hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    });

    // Parsear el form data con formidable
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB máximo
      filter: ({ mimetype }) => {
        // Solo permitir imágenes
        return mimetype?.includes('image') || false;
      },
    });

    console.log('Parsing form data...');
    const [fields, files] = await form.parse(req);
    console.log('Form parsed. Files:', files.file ? 'found' : 'not found');

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
    console.log('Uploading to Cloudinary...', {
      filepath: file.filepath,
      mimetype: file.mimetype,
      size: file.size
    });

    const result = await cloudinary.uploader.upload(file.filepath, {
      folder: 'e-bio-link/profiles', // Carpeta en Cloudinary
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' }, // Crop centrado en la cara
        { quality: 'auto:good' }, // Optimización automática
        { fetch_format: 'auto' }, // Formato automático (WebP si el navegador lo soporta)
      ],
      public_id: `profile-${Date.now()}`, // ID único
    });

    console.log('Upload successful:', result.secure_url);

    // Eliminar archivo temporal
    fs.unlinkSync(file.filepath);

    // Devolver la URL de Cloudinary
    return res.status(200).json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error: any) {
    console.error('❌ ERROR COMPLETO:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    if (error.http_code) {
      console.error('Cloudinary HTTP code:', error.http_code);
    }

    return res.status(500).json({
      error: 'Failed to upload image',
      details: error.message,
      errorName: error.name
    });
  }
}
