'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaCheckCircle } from 'react-icons/fa';

function PagoExitosoContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const externalReference = searchParams.get('external_reference');
  const clientSlug = searchParams.get('slug');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-green-50 to-white p-4">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">¡Pago Exitoso!</h1>
          <p className="text-gray-600">Tu turno ha sido confirmado</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg mb-6 text-left">
          <p className="text-sm text-gray-700 mb-2">
            <strong>ID de Pago:</strong> {paymentId || 'N/A'}
          </p>
          <p className="text-sm text-gray-700 mb-2">
            <strong>Estado:</strong> {status || 'approved'}
          </p>
          {externalReference && (
            <p className="text-sm text-gray-700">
              <strong>Turno ID:</strong> {externalReference}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-gray-600 text-sm">
            Recibirás un email de confirmación con todos los detalles de tu turno.
          </p>

          <Link
            href={clientSlug ? `/biolink/${clientSlug}` : '/'}
            className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded transition"
          >
            {clientSlug ? 'Volver al Perfil del Profesional' : 'Volver al Inicio'}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PagoExitosoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-500">Cargando...</p>
        </div>
      }
    >
      <PagoExitosoContent />
    </Suspense>
  );
}
