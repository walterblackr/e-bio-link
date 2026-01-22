"use client";

import { useState, useEffect } from "react";
import { Calendar, ExternalLink, CheckCircle, AlertCircle, Key, Eye, EyeOff } from "lucide-react";

interface WizardStep2Props {
  onNext: () => void;
  onBack: () => void;
  clientData: any;
}

export default function WizardStep2({ onNext, onBack, clientData }: WizardStep2Props) {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [calUsername, setCalUsername] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  // Verificar si ya tiene Cal.com conectado
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch("/api/calcom/check-connection");
        const data = await res.json();
        setIsConnected(data.connected);
        setCalUsername(data.cal_username);
      } catch (err) {
        console.error("Error checking Cal.com connection:", err);
      } finally {
        setCheckingConnection(false);
      }
    };

    checkConnection();
  }, []);

  const handleValidateApiKey = async () => {
    if (!apiKey.trim()) {
      setError("Por favor ingresá tu API Key de Cal.com");
      return;
    }

    // Validar formato de API key (cal_live_ o cal_test_)
    if (!apiKey.startsWith("cal_live_") && !apiKey.startsWith("cal_test_")) {
      setError("La API Key debe comenzar con 'cal_live_' o 'cal_test_'");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/calcom/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al validar API Key");
      }

      // Éxito - conectar y configurar calendario
      setIsConnected(true);
      setCalUsername(data.username);
      setApiKey(""); // Limpiar por seguridad

      // Llamar a setup automático
      await setupCalendar();

    } catch (err: any) {
      setError(err.message || "Error al validar API Key. Verificá que sea correcta.");
      setLoading(false);
    }
  };

  const setupCalendar = async () => {
    try {
      const res = await fetch("/api/calcom/setup-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        console.warn("Warning al configurar calendario:", data.error);
      }
    } catch (err) {
      console.warn("Warning al configurar calendario automático:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!isConnected) {
      setError("Debes conectar tu cuenta de Cal.com antes de continuar");
      return;
    }
    onNext();
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[800px] mx-auto px-6 py-6">
        {/* Header Compacto */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <h1 className="text-xl font-bold text-gray-900">
              Conectá tu Calendario
            </h1>
          </div>
          <p className="text-sm text-gray-500 ml-4">
            Vinculá tu cuenta de Cal.com para gestionar turnos automáticamente
          </p>
        </div>

        {/* Contenido */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">

          {checkingConnection ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="text-sm text-gray-500 mt-3">Verificando conexión...</p>
            </div>
          ) : (
            <>
              {/* Estado de Conexión */}
              <div className={`mb-6 p-4 rounded-lg border ${
                isConnected
                  ? 'bg-green-50 border-green-200'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-start gap-3">
                  {isConnected ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h3 className={`text-sm font-semibold mb-1 ${
                      isConnected ? 'text-green-900' : 'text-blue-900'
                    }`}>
                      {isConnected ? '¡Cal.com Conectado!' : 'Conexión Pendiente'}
                    </h3>
                    <p className={`text-xs ${
                      isConnected ? 'text-green-700' : 'text-blue-700'
                    }`}>
                      {isConnected
                        ? `Tu cuenta ${calUsername ? `(${calUsername})` : ''} está conectada y configurada.`
                        : 'Necesitás conectar tu cuenta de Cal.com para gestionar tu agenda.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Instrucciones */}
              {!isConnected && (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-gray-900 mb-3">
                    Pasos para conectar:
                  </h2>

                  {/* Paso 1 */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">
                        1
                      </div>
                      <h3 className="text-sm font-medium text-gray-900">
                        Creá tu cuenta gratis en Cal.com
                      </h3>
                    </div>
                    <p className="text-xs text-gray-600 mb-3 ml-8">
                      Si no tenés cuenta, creá una gratis. Solo te tomará 2 minutos.
                    </p>
                    <a
                      href="https://cal.com/signup"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-8 inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Crear cuenta en Cal.com
                    </a>
                  </div>

                  {/* Paso 2 */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">
                        2
                      </div>
                      <h3 className="text-sm font-medium text-gray-900">
                        Obtené tu API Key
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowTutorial(!showTutorial)}
                        className="ml-auto text-xs text-purple-600 hover:text-purple-700 font-medium"
                      >
                        {showTutorial ? "Ocultar" : "Ver tutorial"}
                      </button>
                    </div>

                    {showTutorial && (
                      <div className="ml-8 mb-3 p-3 bg-white border border-gray-200 rounded text-xs text-gray-700 space-y-2">
                        <p className="font-medium">📋 Pasos para obtener tu API Key:</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                          <li>Iniciá sesión en <a href="https://app.cal.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">app.cal.com</a></li>
                          <li>Andá a <strong>Settings → Security</strong></li>
                          <li>En la sección <strong>API Keys</strong>, hacé clic en <strong>+ New API Key</strong></li>
                          <li>Dale un nombre (ej: "Mi Biolink")</li>
                          <li>Copiá la API Key (empieza con <code className="bg-gray-100 px-1 rounded">cal_live_</code>)</li>
                          <li>Pegala en el campo de abajo</li>
                        </ol>
                        <p className="text-purple-600 mt-2">
                          🔒 Tu API Key es privada. No la compartas con nadie.
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-gray-600 mb-3 ml-8">
                      Seguí los pasos para generar tu API Key en Cal.com.
                    </p>
                    <a
                      href="https://app.cal.com/settings/security"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-8 inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Key className="w-4 h-4" />
                      Ir a Settings → Security
                    </a>
                  </div>

                  {/* Paso 3 */}
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                        3
                      </div>
                      <h3 className="text-sm font-medium text-gray-900">
                        Pegá tu API Key aquí
                      </h3>
                    </div>
                    <p className="text-xs text-gray-600 mb-3 ml-8">
                      Una vez que tengas tu API Key, pegala abajo y hacé clic en Validar.
                    </p>

                    <div className="ml-8 space-y-3">
                      <div className="relative">
                        <input
                          type={showApiKey ? "text" : "password"}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="cal_live_xxxxxxxxxxxxxxxxxx"
                          className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-mono"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      <button
                        onClick={handleValidateApiKey}
                        disabled={loading || !apiKey.trim()}
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm"
                      >
                        <Calendar className="w-4 h-4" />
                        {loading ? "Validando y configurando..." : "Validar y Conectar"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Información adicional */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-xs font-semibold text-blue-900 mb-2">
                  ℹ️ ¿Qué haremos con tu API Key?
                </h4>
                <ul className="text-xs text-blue-800 space-y-1 ml-4">
                  <li>• Configuraremos automáticamente tus tipos de eventos</li>
                  <li>• Sincronizaremos tu disponibilidad con tu biolink</li>
                  <li>• Recibiremos notificaciones de nuevos turnos</li>
                  <li>• Tu API Key se guarda encriptada en nuestra base de datos</li>
                </ul>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Botones de Navegación */}
              <div className="flex gap-3 mt-6 pt-6 border-t">
                <button
                  type="button"
                  onClick={onBack}
                  disabled={loading}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors text-sm"
                >
                  ← Anterior
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!isConnected || loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors text-sm"
                >
                  Continuar →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
