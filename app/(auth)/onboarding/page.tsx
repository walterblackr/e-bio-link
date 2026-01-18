import { requireActiveClient } from '../../../lib/auth/client-auth';
import { redirect } from 'next/navigation';

export default async function OnboardingPage() {
  try {
    const client = await requireActiveClient();

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-xl rounded-2xl p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              ¡Bienvenido, {client.email}!
            </h1>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <p className="text-green-800 font-semibold mb-2">
                ✓ Tu cuenta está activa
              </p>
              <p className="text-green-700">
                Plan: <span className="font-semibold">{client.subscription_type}</span>
              </p>
              <p className="text-green-700">
                Tu biolink: <a href={`/biolink/${client.slug}`} className="text-indigo-600 hover:underline font-semibold">ebiolink.com/{client.slug}</a>
              </p>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                Próximos pasos
              </h2>

              <div className="grid gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    1. Conectar Mercado Pago
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Conecta tu cuenta de Mercado Pago para recibir pagos de tus pacientes
                  </p>
                  <a
                    href="/admin/generate-links"
                    className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition text-sm"
                  >
                    Conectar Mercado Pago
                  </a>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    2. Configurar Cal.com
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Conecta tu calendario para gestionar tus turnos automáticamente
                  </p>
                  <button
                    disabled
                    className="inline-block bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg text-sm cursor-not-allowed"
                  >
                    Próximamente
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    3. Personalizar tu Biolink
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Configura tu perfil, agrega tu foto, especialidad y botones personalizados
                  </p>
                  <button
                    disabled
                    className="inline-block bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg text-sm cursor-not-allowed"
                  >
                    Próximamente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    // Si no está autenticado, el middleware lo redirigirá
    redirect('/register');
  }
}
