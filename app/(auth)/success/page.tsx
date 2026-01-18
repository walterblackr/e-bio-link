"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clientId = searchParams.get('client_id');

  const [status, setStatus] = useState<'checking' | 'approved' | 'pending' | 'failed'>('checking');
  const [clientData, setClientData] = useState<any>(null);
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 60; // 60 intentos = 2 minutos (cada 2 segundos)

  useEffect(() => {
    if (!clientId) {
      router.push('/register');
      return;
    }

    // Polling: verificar estado del pago cada 2 segundos
    const checkPaymentStatus = async () => {
      try {
        const res = await fetch(`/api/check-payment-status?client_id=${clientId}`);
        const data = await res.json();

        setClientData(data);

        if (data.status === 'active') {
          // PAGO APROBADO - Redirigir a onboarding
          setStatus('approved');
          setTimeout(() => {
            router.push('/onboarding');
          }, 2000);
        } else if (data.status === 'payment_failed') {
          // PAGO RECHAZADO
          setStatus('failed');
        } else if (data.status === 'pending_payment') {
          // AÚN PENDIENTE
          setStatus('pending');
          setAttempts((prev) => prev + 1);

          // Si llegamos al máximo de intentos, mostrar mensaje
          if (attempts >= MAX_ATTEMPTS) {
            setStatus('pending');
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    };

    // Primera verificación inmediata
    checkPaymentStatus();

    // Continuar polling si aún está pendiente
    const interval = setInterval(() => {
      if (status === 'checking' || status === 'pending') {
        checkPaymentStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [clientId, router, attempts, status]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white shadow-2xl rounded-2xl p-8 text-center">
          {status === 'checking' || status === 'pending' ? (
            <>
              <div className="mb-6">
                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Procesando tu pago...
              </h1>
              <p className="text-gray-600 mb-6">
                Estamos verificando tu pago con Mercado Pago. No cierres esta ventana.
              </p>
              {clientData && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Email:</span> {clientData.email}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Tu URL:</span> ebiolink.com/{clientData.slug}
                  </p>
                </div>
              )}
              {attempts > 30 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                  <p>
                    El pago está tardando más de lo esperado. Mercado Pago puede tardar unos minutos en procesar el pago.
                  </p>
                  <p className="mt-2">
                    Recibirás un email cuando tu cuenta esté activa.
                  </p>
                </div>
              )}
            </>
          ) : status === 'approved' ? (
            <>
              <div className="mb-6">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Pago Confirmado!
              </h1>
              <p className="text-gray-600 mb-6">
                Tu cuenta ha sido activada exitosamente.
              </p>
              {clientData && (
                <div className="bg-green-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-semibold">Bienvenido:</span> {clientData.email}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Tu biolink:</span>{' '}
                    <a
                      href={`/biolink/${clientData.slug}`}
                      className="text-indigo-600 hover:underline"
                    >
                      ebiolink.com/{clientData.slug}
                    </a>
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-500">
                Redirigiendo al onboarding...
              </p>
            </>
          ) : (
            <>
              <div className="mb-6">
                <XCircle className="w-16 h-16 text-red-600 mx-auto" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Pago Rechazado
              </h1>
              <p className="text-gray-600 mb-6">
                Hubo un problema con tu pago. Por favor intenta nuevamente.
              </p>
              <a
                href="/propuesta"
                className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                Volver a Intentar
              </a>
            </>
          )}
        </div>

        {/* Support Note */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ¿Problemas con tu pago?{' '}
            <a
              href="https://wa.me/5492994091255"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline"
            >
              Contacta soporte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
