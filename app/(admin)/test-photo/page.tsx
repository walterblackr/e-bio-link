'use client';

import { useState } from 'react';
import PhotoUploader from '@/app/components/PhotoUploader';

export default function TestPhotoPage() {
  const [photoUrl, setPhotoUrl] = useState('');
  const [slug, setSlug] = useState('dr-valeria-1');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handlePhotoUploaded = (url: string) => {
    setPhotoUrl(url);
    setMessage('Foto subida correctamente. Ahora guardá los cambios.');
  };

  const handleSave = async () => {
    if (!photoUrl) {
      setMessage('No hay foto para guardar');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/update-profile-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, photoUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar');
      }

      setMessage('✅ Foto guardada correctamente en el perfil');
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Probar Upload de Foto de Perfil
          </h1>
          <p className="text-gray-600 mb-8">
            Página temporal para probar la funcionalidad de Cloudinary
          </p>

          {/* Selector de perfil */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug del perfil a actualizar:
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="dr-valeria-1"
            />
          </div>

          {/* Uploader */}
          <PhotoUploader
            currentPhotoUrl={photoUrl}
            onPhotoUploaded={handlePhotoUploaded}
          />

          {/* Botón guardar */}
          {photoUrl && (
            <div className="mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`
                  w-full px-6 py-3 rounded-lg font-medium transition-colors
                  ${saving
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                  }
                `}
              >
                {saving ? 'Guardando...' : 'Guardar en perfil'}
              </button>
            </div>
          )}

          {/* Mensaje */}
          {message && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
              {message}
            </div>
          )}

          {/* URL de la foto */}
          {photoUrl && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-1">URL de Cloudinary:</p>
              <p className="text-xs text-gray-600 break-all font-mono">{photoUrl}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
