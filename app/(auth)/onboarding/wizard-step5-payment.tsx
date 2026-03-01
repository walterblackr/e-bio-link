"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, CreditCard, Building2, Loader2, ExternalLink } from "lucide-react";

interface WizardStep5PaymentProps {
  onNext: () => void;
  onBack: () => void;
  clientSlug: string;
}

export default function WizardStep5Payment({
  onNext,
  onBack,
  clientSlug,
}: WizardStep5PaymentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectingMP, setConnectingMP] = useState(false);
  const [error, setError] = useState("");

  // Datos del formulario
  const [paymentMethod, setPaymentMethod] = useState<"mp" | "transfer">("mp");
  const [mpConnected, setMpConnected] = useState(false);
  const [cbuAlias, setCbuAlias] = useState("");
  const [bancoNombre, setBancoNombre] = useState("");
  const [titularCuenta, setTitularCuenta] = useState("");

  const loadData = () => {
    return fetch("/api/onboarding/step5")
      .then((r) => r.json())
      .then((data) => {
        setPaymentMethod(data.payment_method || "mp");
        setMpConnected(data.mp_connected || false);
        setCbuAlias(data.cbu_alias || "");
        setBancoNombre(data.banco_nombre || "");
        setTitularCuenta(data.titular_cuenta || "");
      })
      .catch(() => {});
  };

  // Cargar configuración actual y detectar retorno del OAuth de MP
  useEffect(() => {
    const mpParam = searchParams.get("mp");

    if (mpParam === "connected") {
      // Volvimos del OAuth de MP exitosamente — recargar datos y limpiar URL
      loadData().finally(() => {
        setLoading(false);
        router.replace("/onboarding");
      });
    } else {
      loadData().finally(() => setLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnectMP = async () => {
    setConnectingMP(true);
    setError("");
    try {
      const res = await fetch("/api/mp/auth-url");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al obtener el link de Mercado Pago");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Error de conexión. Intentá nuevamente.");
    } finally {
      setConnectingMP(false);
    }
  };

  const handleSave = async () => {
    setError("");

    if (paymentMethod === "transfer" && (!cbuAlias.trim() || !titularCuenta.trim())) {
      setError("CBU/Alias y Titular son campos requeridos para transferencia.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/onboarding/step5", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_method: paymentMethod,
          cbu_alias: cbuAlias || null,
          banco_nombre: bancoNombre || null,
          titular_cuenta: titularCuenta || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al guardar");
        return;
      }

      onNext();
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[800px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <h1 className="text-xl font-bold text-gray-900">
              Método de Cobro
            </h1>
          </div>
          <p className="text-sm text-gray-500 ml-4">
            Elegí cómo querés recibir los pagos de tus pacientes
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {/* Selector de método */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* Mercado Pago */}
            <button
              type="button"
              onClick={() => setPaymentMethod("mp")}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                paymentMethod === "mp"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <CreditCard
                  className={`w-5 h-5 ${
                    paymentMethod === "mp" ? "text-blue-600" : "text-gray-400"
                  }`}
                />
                {paymentMethod === "mp" && (
                  <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-900">Mercado Pago</p>
              <p className="text-xs text-gray-500 mt-0.5">Cobro automático online</p>
            </button>

            {/* Transferencia */}
            <button
              type="button"
              onClick={() => setPaymentMethod("transfer")}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                paymentMethod === "transfer"
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Building2
                  className={`w-5 h-5 ${
                    paymentMethod === "transfer" ? "text-green-600" : "text-gray-400"
                  }`}
                />
                {paymentMethod === "transfer" && (
                  <span className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-900">Transferencia</p>
              <p className="text-xs text-gray-500 mt-0.5">CBU/Alias, sin comisión</p>
            </button>
          </div>

          {/* Contenido por método */}
          {paymentMethod === "mp" ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">
                  Mercado Pago procesa los pagos automáticamente y te acredita el dinero en tu cuenta.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  <p className="text-xs text-amber-800 font-medium">
                    Comisión: ~6% + IVA por transacción (retiro inmediato).
                    Podés reducirla si diferís el retiro desde tu cuenta de MP.
                  </p>
                </div>
                <a
                  href="/metodos-de-cobro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:underline"
                >
                  Comparar métodos de cobro
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {mpConnected ? (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-900">Mercado Pago conectado</p>
                    <p className="text-xs text-green-600">Tu cuenta está lista para recibir pagos.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800 font-medium mb-3">
                    Necesitás conectar tu cuenta de Mercado Pago
                  </p>
                  <button
                    type="button"
                    onClick={handleConnectMP}
                    disabled={connectingMP}
                    className="inline-flex items-center gap-2 bg-[#009ee3] hover:bg-[#007eb5] disabled:bg-[#009ee3]/60 text-white font-semibold py-2.5 px-5 rounded-lg text-sm transition-colors"
                  >
                    {connectingMP ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Redirigiendo...
                      </>
                    ) : (
                      "Conectar Mercado Pago"
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">
                  El paciente realiza la transferencia y sube el comprobante. Vos confirmás manualmente.
                </p>
                <p className="text-xs text-gray-400">
                  Sin comisiones. Requiere tu confirmación para cada turno.
                </p>
                <a
                  href="/metodos-de-cobro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:underline"
                >
                  Comparar métodos de cobro
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  CBU o Alias <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={cbuAlias}
                  onChange={(e) => setCbuAlias(e.target.value)}
                  placeholder="ej: mi.alias o 0000003100012345678901"
                  className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Nombre del banco <span className="text-gray-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={bancoNombre}
                  onChange={(e) => setBancoNombre(e.target.value)}
                  placeholder="ej: Banco Galicia, Mercado Pago"
                  className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Titular de la cuenta <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={titularCuenta}
                  onChange={(e) => setTitularCuenta(e.target.value)}
                  placeholder="ej: Juan Pérez"
                  className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

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
              disabled={saving}
              className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors text-sm"
            >
              ← Anterior
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Finalizar →"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
