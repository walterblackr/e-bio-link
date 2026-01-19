'use client';

import { useState } from 'react';

interface PhotoUploaderProps {
  currentPhotoUrl?: string;
  onPhotoUploaded: (url: string) => void;
}

export default function PhotoUploader({ currentPhotoUrl, onPhotoUploaded }: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validaciones cliente
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede pesar más de 5MB');
      return;
    }

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Solo se permiten archivos JPG, PNG o WebP');
      return;
    }

    setError(null);

    // Mostrar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Subir a Cloudinary
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload-client-photo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al subir la imagen');
      }

      // Notificar al componente padre
      onPhotoUploaded(data.url);
    } catch (err: any) {
      setError(err.message);
      // Volver a la foto anterior
      setPreview(currentPhotoUrl || null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Preview de la foto */}
      <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
        {preview ? (
          <img
            src={preview}
            alt="Foto de perfil"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl">
            👤
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-[10px]">...</div>
          </div>
        )}
      </div>

      {/* Botón de upload y texto */}
      <div className="flex-1">
        <label
          htmlFor="photo-upload"
          className={`
            inline-block px-3 py-1.5 text-xs rounded-lg font-medium cursor-pointer transition-colors
            ${uploading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
        >
          {uploading ? 'Subiendo...' : preview ? 'Cambiar' : 'Subir foto'}
        </label>
        <input
          id="photo-upload"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />

        {/* Recomendaciones */}
        <p className="text-[10px] text-gray-400 mt-1">
          JPG, PNG o WebP - Máx 5MB
        </p>

        {/* Error */}
        {error && (
          <div className="mt-1.5 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-[10px]">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
