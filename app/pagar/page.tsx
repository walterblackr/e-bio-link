'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

// ─── Nuevo flujo: acepta ?booking_id=xxx&slug=xxx ─────────────────────────────
// ─── Flujo legacy Cal.com: acepta ?uid=xxx&user=xxx&attendeeName=xxx... ────────

function PagarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  // Nuevo flujo
  const bookingIdParam = searchParams.get('booking_id');
  const slugParam = searchParams.get('slug');

  // Flujo legacy Cal.com
  const calUid = searchParams.get('uid');
  const calUsername = searchParams.get('user');
  const calAttendeeName = searchParams.get('attendeeName');
  const calEmail = searchParams.get('email');
  const calStartTime = searchParams.get('startTime');

  const isNewFlow = !!bookingIdParam;
  const isLegacyFlow = !isNewFlow && !!calUid;

  const [bookingData, setBookingData] = useState<any>(null);
  const [legacyData, setLegacyData] = useState<any>(null);
  const [precio, setPrecio] = useState<number>(0);

  useEffect(() => {
    if (isNewFlow) {
      if (!slugParam) {
        setError('Falta el slug del profesional.');
        setLoading(false);
        return;
      }

      fetch(`/api/check-payment-status?booking_id=${bookingIdParam}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
            return;
          }
          setBookingData(data);
        })
        .catch(() => setError('Error al cargar los datos del turno.'))
        .finally(() => setLoading(false));
    } else if (isLegacyFlow) {
      if (!calAttendeeName || !calEmail || !calStartTime || !calUsername) {
        setError('Faltan datos del turno. Por favor reservá tu turno desde el calendario.');
        setLoading(false);
        return;
      }

      fetch(`/api/obtener-precio-consulta?calUsername=${calUsername}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.error) {
            setError('No se encontró el médico.');
            return;
          }

          setLegacyData({
            name: decodeURIComponent(calAttendeeName),
            email: decodeURIComponent(calEmail),
            date: new Date(calStartTime).toLocaleString('es-AR', {
              dateStyle: 'full',
              timeStyle: 'short',
            }),
            bookingId: calUid,
            clientSlug: data.slug,
            startTime: calStartTime,
          });
          setPrecio(parseFloat(data.monto_consulta));
        })
        .catch(() => setError('Error al cargar los datos del médico'))
        .finally(() => setLoading(false));
    } else {
      setError('No se encontró información del turno. Por favor reservá tu turno desde el calendario.');
      setLoading(false);
    }
  }, []);

  const handlePagarNuevo = async () => {
    if (!bookingIdParam || !slugParam) return;
    setPaying(true);

    try {
      const response = await fetch('/api/crear-preferencia-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingIdParam,
          client_slug: slugParam,
        }),
      });

      const data = await response.json();

      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        setError(`Error al generar el link de pago: ${data.error}`);
        setPaying(false);
      }
    } catch {
      setError('Error al procesar el pago');
      setPaying(false);
    }
  };

  const handlePagarLegacy = async () => {
    if (!legacyData) return;
    setPaying(true);

    try {
      const response = await fetch('/api/crear-preferencia-pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_slug: legacyData.clientSlug,
          paciente_nombre: legacyData.name,
          paciente_email: legacyData.email,
          cal_booking_id: legacyData.bookingId,
          fecha_hora: legacyData.startTime,
          monto: precio,
        }),
      });

      const data = await response.json();

      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        setError(`Error al generar el link de pago: ${data.details || data.error}`);
        setPaying(false);
      }
    } catch {
      setError('Error al procesar el pago');
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-lg text-gray-600">Cargando datos del turno...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Confirmar Pago</h1>
          <p className="text-gray-600 text-sm">Revisá los datos y procedé con el pago</p>
        </div>

        {/* Nuevo flujo */}
        {isNewFlow && bookingData && (
          <div className="mb-6 bg-blue-50 p-5 rounded-xl border border-blue-100">
            <div className="space-y-3">
              {bookingData.paciente_nombre && (
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Paciente</p>
                  <p className="text-gray-900 font-medium">{bookingData.paciente_nombre}</p>
                </div>
              )}
              {bookingData.fecha_hora && (
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Fecha y Hora</p>
                  <p className="text-gray-900 font-medium">
                    {new Date(bookingData.fecha_hora).toLocaleString('es-AR', {
                      dateStyle: 'full',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              )}
            </div>
            {bookingData.monto && (
              <div className="mt-5 pt-5 border-t border-blue-200">
                <p className="text-2xl font-bold text-green-600 text-center">
                  ${parseFloat(bookingData.monto).toLocaleString('es-AR')}
                </p>
                <p className="text-xs text-gray-500 text-center mt-1">Total a pagar</p>
              </div>
            )}
          </div>
        )}

        {/* Flujo legacy Cal.com */}
        {isLegacyFlow && legacyData && (
          <div className="mb-6 bg-blue-50 p-5 rounded-xl border border-blue-100">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Paciente</p>
                <p className="text-gray-900 font-medium">{legacyData.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Email</p>
                <p className="text-gray-700">{legacyData.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Fecha y Hora</p>
                <p className="text-gray-900 font-medium">{legacyData.date}</p>
              </div>
            </div>
            <div className="mt-5 pt-5 border-t border-blue-200">
              <p className="text-2xl font-bold text-green-600 text-center">
                ${precio.toLocaleString('es-AR')}
              </p>
              <p className="text-xs text-gray-500 text-center mt-1">Total a pagar</p>
            </div>
          </div>
        )}

        <button
          onClick={isNewFlow ? handlePagarNuevo : handlePagarLegacy}
          disabled={paying}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mb-3"
        >
          {paying ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Procesando...
            </span>
          ) : (
            'Pagar con Mercado Pago'
          )}
        </button>

        <p className="text-sm text-center text-gray-500">
          Serás redirigido a Mercado Pago para completar el pago de forma segura
        </p>
      </div>
    </div>
  );
}

export default function PagarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando...</p>
          </div>
        </div>
      }
    >
      <PagarContent />
    </Suspense>
  );
}
