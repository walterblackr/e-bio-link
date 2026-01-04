'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function PagoExitosoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [bookingData, setBookingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const paymentId = searchParams.get('payment_id');
  const preferenceId = searchParams.get('preference_id');
  const status = searchParams.get('status');

  useEffect(() => {
    // Opcional: Consultar el estado del booking
    // Por ahora solo mostramos un mensaje genérico
    setLoading(false);
  }, [paymentId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando pago...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Card de éxito */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Icono de éxito */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Título */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ¡Pago Exitoso! ✅
          </h1>

          {/* Descripción */}
          <p className="text-gray-600 mb-6">
            Tu turno ha sido confirmado. Recibirás un email con los detalles de tu consulta.
          </p>

          {/* Detalles del pago */}
          {paymentId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Detalles del pago
              </h3>
              <div className="space-y-1 text-sm">
                <p className="text-gray-600">
                  <span className="font-medium">ID de pago:</span> {paymentId}
                </p>
                {status && (
                  <p className="text-gray-600">
                    <span className="font-medium">Estado:</span>{' '}
                    <span className="text-green-600 font-semibold">
                      {status === 'approved' ? 'Aprobado' : status}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Información adicional */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              📧 Te enviamos un email de confirmación con el link de la reunión y toda la
              información necesaria.
            </p>
          </div>

          {/* Botones de acción */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        </div>

        {/* Soporte */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ¿Tenés alguna duda?{' '}
            <a
              href="https://wa.me/5492994091255"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Contactanos
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function PagoExitosoPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </main>
    }>
      <PagoExitosoContent />
    </Suspense>
  );
}
