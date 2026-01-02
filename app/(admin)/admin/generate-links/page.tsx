// pages/admin/generate-links.tsx
// Panel simple para que VOS generes links manualmente

'use client';

import { useState } from 'react';

export default function GenerateLinksPage() {
  const [clientName, setClientName] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/generate-auth-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: `client_${Date.now()}`, // Auto-generado
          clientName,
          adminKey,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al generar link');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('¡Copiado al portapapeles!');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔐 Panel de Administración
          </h1>
          <p className="text-gray-600">
            Generá links de autorización de Mercado Pago para tus clientes
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleGenerate} className="space-y-6">
            {/* Nombre del Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Cliente/Médico
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ej: Dr. Juan Pérez"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
              />
              <p className="text-xs text-gray-500 mt-1">
                Este nombre se usará para identificar al cliente en la base de datos
              </p>
            </div>

            {/* Admin Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clave de Administrador
              </label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Tu ADMIN_SECRET_KEY"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
              />
              <p className="text-xs text-gray-500 mt-1">
                Esta clave está configurada en tus variables de entorno de Vercel
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">❌ {error}</p>
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? '⏳ Generando...' : '🔗 Generar Link'}
            </button>
          </form>

          {/* Resultado */}
          {result && (
            <div className="mt-8 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-semibold mb-2">✅ Link generado exitosamente</p>
                <p className="text-green-700 text-sm">
                  Enviá este link al cliente por WhatsApp, email o SMS
                </p>
              </div>

              {/* Link de Autorización */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Link de Autorización</label>
                  <button
                    onClick={() => copyToClipboard(result.authUrl)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    📋 Copiar
                  </button>
                </div>
                <div className="bg-white border border-gray-300 rounded p-3 break-all text-sm font-mono text-gray-800">
                  {result.authUrl}
                </div>
              </div>

              {/* Mensaje para enviar */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Mensaje para el Cliente</label>
                  <button
                    onClick={() => copyToClipboard(`Hola! Para conectar tu cuenta de Mercado Pago, ingresá a este link:\n\n${result.authUrl}\n\nEl link expira en 24 horas.`)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    📋 Copiar Mensaje
                  </button>
                </div>
                <div className="bg-white border border-gray-300 rounded p-3 text-sm text-gray-800 whitespace-pre-wrap">
                  Hola! Para conectar tu cuenta de Mercado Pago, ingresá a este link:
                  {'\n\n'}
                  {result.authUrl}
                  {'\n\n'}
                  El link expira en 24 horas.
                </div>
              </div>

              {/* Info Técnica */}
              <details className="bg-gray-50 rounded-lg p-4">
                <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                  📊 Información Técnica
                </summary>
                <div className="mt-3 space-y-2 text-sm font-mono text-gray-600">
                  <p><strong>Session ID:</strong> {result.sessionId}</p>
                  <p><strong>Expira:</strong> {new Date(result.expiresAt).toLocaleString('es-AR')}</p>
                  <p><strong>Cliente:</strong> {clientName}</p>
                </div>
              </details>

              {/* Botón para generar otro */}
              <button
                onClick={() => {
                  setResult(null);
                  setClientName('');
                }}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                ➕ Generar Otro Link
              </button>
            </div>
          )}
        </div>

        {/* Instrucciones */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">📝 Instrucciones</h3>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>Ingresá el nombre del cliente (ej: "Dr. Juan Pérez")</li>
            <li>Ingresá tu clave de administrador (ADMIN_SECRET_KEY)</li>
            <li>Hacé clic en "Generar Link"</li>
            <li>Copiá el link o el mensaje completo</li>
            <li>Enviáselo al cliente por WhatsApp/Email</li>
            <li>El cliente hace clic, autoriza en Mercado Pago, y listo ✅</li>
          </ol>
        </div>

        {/* Seguridad */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3">🔒 Seguridad</h3>
          <ul className="text-sm text-yellow-800 space-y-2 list-disc list-inside">
            <li>Guardá tu ADMIN_SECRET_KEY en un lugar seguro</li>
            <li>No compartas esta clave con nadie</li>
            <li>Los links expiran en 24 horas</li>
            <li>Cada link solo se puede usar una vez</li>
            <li>Solo vos podés acceder a este panel con la clave</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
