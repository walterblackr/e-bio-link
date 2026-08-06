'use client';

import { useRef, useState } from 'react';
import { Upload, Check } from 'lucide-react';

interface Props {
  onSubmit: (file: File) => Promise<void>;
  uploading: boolean;
  error: string;
}

export default function ComprobanteUploader({ onSubmit, uploading, error }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!file) return;
    await onSubmit(file);
  };

  return (
    <div className="space-y-3">
      {/* Área de adjunto */}
      <label className="block cursor-pointer">
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={e => setFile(e.target.files?.[0] || null)}
        />
        {file ? (
          <div className="border-2 border-green-400 bg-green-50 rounded-xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-green-800 truncate">{file.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">Tocá para cambiar el archivo</p>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-xl p-6 text-center transition-colors">
            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Upload className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-sm font-semibold text-gray-700">Tocá acá para adjuntar tu comprobante</p>
            <p className="text-xs text-gray-400 mt-1">Foto o PDF de la transferencia · máx 10 MB</p>
          </div>
        )}
      </label>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Botón de envío */}
      <button
        onClick={handleSubmit}
        disabled={!file || uploading}
        className={`w-full font-semibold py-3 px-4 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 ${
          file && !uploading
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        {uploading ? (
          <>
            <div className="w-4 h-4 border-2 border-gray-400/40 border-t-gray-500 rounded-full animate-spin" />
            Subiendo...
          </>
        ) : (
          'Enviar comprobante →'
        )}
      </button>
      {!file && !uploading && (
        <p className="text-xs text-gray-400 text-center">Primero adjuntá el comprobante para habilitarlo</p>
      )}
    </div>
  );
}
