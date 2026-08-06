'use client';

import { useRef, useState } from 'react';
import { Upload, Check, FileText } from 'lucide-react';

interface Props {
  onSubmit: (file: File) => Promise<void>;
  uploading: boolean;
  error: string;
}

export default function ComprobanteUploader({ onSubmit, uploading, error }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | undefined) => {
    if (f) setFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    await onSubmit(file);
  };

  const isPdf = file?.type === 'application/pdf' || file?.name.endsWith('.pdf');

  return (
    <div className="space-y-3">
      {/* Área de adjunto */}
      {file ? (
        /* Estado con archivo seleccionado */
        <div className="border-2 border-green-400 bg-green-50 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <Check className="w-4 h-4 text-green-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-green-800 truncate">{file.name}</p>
            <button
              onClick={() => { setFile(null); }}
              className="text-xs text-gray-500 mt-0.5 underline"
            >
              Cambiar
            </button>
          </div>
        </div>
      ) : (
        /* Botones de selección separados */
        <div className="space-y-2">
          {/* Primario: foto / captura de pantalla */}
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-xl p-5 text-center transition-colors"
          >
            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-2">
              <Upload className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-sm font-semibold text-gray-700">Foto o captura de pantalla</p>
            <p className="text-xs text-gray-400 mt-1">Abre tu galería de fotos</p>
          </button>

          {/* Secundario: PDF */}
          <button
            type="button"
            onClick={() => pdfInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Tengo el comprobante en PDF
          </button>
        </div>
      )}

      {/* Inputs ocultos */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0])}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0])}
      />

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
