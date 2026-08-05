'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useParams } from 'next/navigation';

interface BookingData {
  id: number;
  public_token: string;
  estado: string;
  fecha_hora: string;
  monto: number;
  expires_at: string | null;
  payment_method: string;
  paciente_nombre: string;
  evento_nombre: string;
  modalidad: 'virtual' | 'presencial';
  direccion: string | null;
  cobro_tipo: 'total' | 'sena';
  sena_monto: number | null;
  precio_total: number;
  slug: string;
  nombre_completo: string;
  cbu_alias: string | null;
  banco_nombre: string | null;
  titular_cuenta: string | null;
  payment_window_minutes: number;
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}

export default function PagoPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [aliasCopied, setAliasCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) { setError('Link inválido'); setLoading(false); return; }
    fetch(`/api/booking-by-token?token=${token}`)
      .then(async r => {
        const d = await r.json();
        if (r.status === 404) { setError('Reserva no encontrada'); return; }
        if (!r.ok) { setError('Error al cargar la reserva'); return; }
        if (d.booking) setBooking(d.booking);
        else setError('Reserva no encontrada');
      })
      .catch(() => setError('Error al cargar la reserva'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleUpload = async () => {
    if (!file || !booking) return;
    setUploading(true);
    setUploadError('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('public_token', booking.public_token);
    const res = await fetch('/api/upload-comprobante', { method: 'POST', body: fd });
    const data = await res.json();
    setUploading(false);
    if (res.status === 410) {
      setBooking(b => b ? { ...b, estado: 'cancelled' } : b);
      return;
    }
    if (!res.ok) { setUploadError(data.error || 'Error al subir el comprobante'); return; }
    setUploadDone(true);
    setBooking(b => b ? { ...b, estado: 'pending_confirmation' } : b);
  };

  const copyAlias = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setAliasCopied(true);
      setTimeout(() => setAliasCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-sm">
          <p className="text-gray-500 mb-4">{error || 'Reserva no encontrada'}</p>
          <a href="/" className="text-indigo-600 underline text-sm">Volver al inicio</a>
        </div>
      </div>
    );
  }

  const isExpired = booking.expires_at && new Date(booking.expires_at) <= new Date();
  const fecha = formatFecha(booking.fecha_hora);
  const biolink = `/biolink/${booking.slug}`;

  // ── Estado: vencida o cancelada ─────────────────────────────────────────────
  if (booking.estado === 'cancelled' || (booking.estado === 'pending_payment' && isExpired)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">El plazo de pago venció</h1>
          <p className="text-sm text-gray-500 mb-6">
            El horario quedó libre para otros pacientes. No se cobró nada.
          </p>
          <a href={biolink} className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl text-sm transition-colors">
            Reservar de nuevo →
          </a>
        </div>
      </div>
    );
  }

  // ── Estado: comprobante recibido, esperando confirmación ────────────────────
  if (booking.estado === 'pending_confirmation' || uploadDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Comprobante recibido</h1>
          <p className="text-sm text-gray-500 mb-1">
            <strong>{booking.nombre_completo}</strong> valida el pago y te confirma el turno.
          </p>
          <p className="text-xs text-gray-400">Cuando esté confirmado, te llegará un email.</p>
        </div>
      </div>
    );
  }

  // ── Estado: confirmado ──────────────────────────────────────────────────────
  if (booking.estado === 'confirmed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full p-8 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Turno confirmado</h1>
          <p className="text-sm text-gray-500">{fecha}</p>
          <p className="text-sm text-gray-500 mt-1">con <strong>{booking.nombre_completo}</strong></p>
        </div>
      </div>
    );
  }

  // ── Estado: pending_payment vigente → mostrar instrucciones + uploader ──────
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-sm mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 px-6 py-5">
            <h1 className="text-white font-bold text-lg">Completá el pago</h1>
            <p className="text-indigo-200 text-xs mt-1">{booking.nombre_completo}</p>
          </div>

          <div className="p-6 space-y-4">
            {/* Datos del turno */}
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Turno</p>
                <p className="text-sm font-medium text-gray-900">{booking.evento_nombre}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Fecha y hora</p>
                <p className="text-sm font-medium text-gray-900">{fecha}</p>
              </div>
              {booking.modalidad === 'presencial' && booking.direccion && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Dirección</p>
                  <p className="text-sm font-medium text-gray-900">📍 {booking.direccion}</p>
                </div>
              )}
            </div>

            {/* Monto */}
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-green-700">${Number(booking.monto).toLocaleString('es-AR')}</p>
              <p className="text-xs text-green-600 mt-1">
                {booking.cobro_tipo === 'sena' ? 'Seña' : 'Total'}
              </p>
              {booking.cobro_tipo === 'sena' && booking.precio_total && (
                <p className="text-xs text-gray-400 mt-1">
                  Total consulta: ${Number(booking.precio_total).toLocaleString('es-AR')} · el saldo se abona en el turno
                </p>
              )}
            </div>

            {/* Datos bancarios */}
            {(booking.cbu_alias || booking.banco_nombre || booking.titular_cuenta) && (
              <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Datos para transferir</p>
                {booking.cbu_alias && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">Alias / CBU</p>
                      <p className="text-sm font-semibold text-gray-900 font-mono">{booking.cbu_alias}</p>
                    </div>
                    <button
                      onClick={() => copyAlias(booking.cbu_alias!)}
                      className="text-xs text-indigo-600 font-semibold ml-3 shrink-0"
                    >
                      {aliasCopied ? '¡Copiado!' : 'Copiar'}
                    </button>
                  </div>
                )}
                {booking.titular_cuenta && (
                  <div>
                    <p className="text-xs text-gray-400">Titular</p>
                    <p className="text-sm text-gray-900">{booking.titular_cuenta}</p>
                  </div>
                )}
                {booking.banco_nombre && (
                  <div>
                    <p className="text-xs text-gray-400">Banco</p>
                    <p className="text-sm text-gray-900">{booking.banco_nombre}</p>
                  </div>
                )}
              </div>
            )}

            {/* Uploader */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">Subí el comprobante</p>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                  file ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
                {file ? (
                  <p className="text-sm text-green-700 font-medium">{file.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-500">Tocá para seleccionar</p>
                    <p className="text-xs text-gray-400 mt-1">Imagen o PDF · máx 10 MB</p>
                  </>
                )}
              </div>

              {uploadError && (
                <p className="text-xs text-red-500 mt-2">{uploadError}</p>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Subiendo...
                  </>
                ) : 'Enviar comprobante →'}
              </button>
            </div>

            {/* Aviso plazo */}
            {booking.expires_at && (
              <p className="text-xs text-amber-600 text-center">
                Plazo para pagar: hasta las{' '}
                {new Date(booking.expires_at).toLocaleTimeString('es-AR', {
                  hour: '2-digit', minute: '2-digit',
                  timeZone: 'America/Argentina/Buenos_Aires',
                })}{' '}
                del{' '}
                {new Date(booking.expires_at).toLocaleDateString('es-AR', {
                  day: 'numeric', month: 'long',
                  timeZone: 'America/Argentina/Buenos_Aires',
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
