"use client";

import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";

interface WizardStep2GoogleProps {
  onNext: () => void;
  onBack: () => void;
}

export default function WizardStep2Google({ onNext, onBack }: WizardStep2GoogleProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [error, setError] = useState("");

  // Verificar si ya tiene Google Calendar conectado
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch("/api/google/check-connection");
        const data = await res.json();
        setIsConnected(data.connected);
        setGoogleEmail(data.google_email);
      } catch (err) {
        console.error("Error checking Google connection:", err);
      } finally {
        setCheckingConnection(false);
      }
    };

    checkConnection();
  }, []);

  // Detectar retorno de OAuth (query param ?google=connected)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("google") === "connected") {
      // Re-check connection after OAuth redirect
      const recheck = async () => {
        try {
          const res = await fetch("/api/google/check-connection");
          const data = await res.json();
          setIsConnected(data.connected);
          setGoogleEmail(data.google_email);
        } catch (err) {
          console.error("Error re-checking connection:", err);
        }
      };
      recheck();
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/google/auth-url");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al generar URL de autorización");
      }

      // Redirigir a Google OAuth
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || "Error al conectar con Google");
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!isConnected) {
      setError("Debés conectar tu Google Calendar antes de continuar");
      return;
    }
    onNext();
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[800px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <h1 className="text-xl font-bold text-gray-900">
              Conectá tu Calendario
            </h1>
          </div>
          <p className="text-sm text-gray-500 ml-4">
            Vinculá tu Google Calendar para gestionar turnos automáticamente
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
                      {isConnected ? 'Google Calendar Conectado' : 'Conexión Pendiente'}
                    </h3>
                    <p className={`text-xs ${
                      isConnected ? 'text-green-700' : 'text-blue-700'
                    }`}>
                      {isConnected
                        ? `Conectado con ${googleEmail || 'tu cuenta de Google'}`
                        : 'Conectá tu cuenta de Google para sincronizar tu agenda de turnos.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Botón de Conexión */}
              {!isConnected && (
                <div className="text-center py-6">
                  <div className="mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      Un solo click para conectar
                    </h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      Al conectar, podremos ver tu disponibilidad y crear eventos de turnos automáticamente en tu calendario.
                    </p>
                  </div>

                  <button
                    onClick={handleConnect}
                    disabled={loading}
                    className="inline-flex items-center gap-3 px-8 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-semibold text-gray-700"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {loading ? "Conectando..." : "Conectar Google Calendar"}
                  </button>
                </div>
              )}

              {/* Qué hacemos con tu calendario */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-xs font-semibold text-blue-900 mb-2">
                  ¿Qué haremos con tu calendario?
                </h4>
                <ul className="text-xs text-blue-800 space-y-1 ml-4">
                  <li>Verificaremos tu disponibilidad para no superponer turnos</li>
                  <li>Crearemos eventos con link de Google Meet para consultas virtuales</li>
                  <li>Enviaremos recordatorios automáticos a tus pacientes</li>
                  <li>Tus datos se guardan encriptados de forma segura</li>
                </ul>
              </div>

              {/* Error */}
              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Navegación */}
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
