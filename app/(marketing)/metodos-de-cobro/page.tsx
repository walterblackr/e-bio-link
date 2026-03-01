import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Métodos de cobro | e-bio-link",
  description:
    "Compará Mercado Pago y transferencia bancaria para recibir pagos de tus pacientes.",
};

export default function MetodosDeCobro() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Métodos de cobro
          </h1>
          <p className="text-gray-500 text-base max-w-xl mx-auto">
            Cada opción tiene sus ventajas. Elegí la que mejor se adapte a tu
            práctica profesional.
          </p>
        </div>

        {/* Tabla comparativa */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm mb-8">
          <div className="grid grid-cols-3 text-sm">
            {/* Encabezados */}
            <div className="p-4 bg-gray-50 border-b border-r border-gray-200 font-medium text-gray-500" />
            <div className="p-4 bg-blue-50 border-b border-r border-gray-200 text-center">
              <p className="font-bold text-blue-700 text-base">Mercado Pago</p>
              <p className="text-blue-500 text-xs mt-0.5">Cobro automático</p>
            </div>
            <div className="p-4 bg-green-50 border-b border-gray-200 text-center">
              <p className="font-bold text-green-700 text-base">Transferencia</p>
              <p className="text-green-500 text-xs mt-0.5">CBU / Alias</p>
            </div>

            {/* Comisión */}
            <div className="p-4 border-b border-r border-gray-100 text-gray-600 font-medium">
              Comisión
            </div>
            <div className="p-4 border-b border-r border-gray-100 text-center">
              <span className="inline-block bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                ~6% + IVA
              </span>
              <p className="text-xs text-gray-400 mt-1">
                Retiro inmediato. Menor si diferís el retiro.
              </p>
            </div>
            <div className="p-4 border-b border-gray-100 text-center">
              <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                Sin comisión
              </span>
            </div>

            {/* Cobro */}
            <div className="p-4 border-b border-r border-gray-100 text-gray-600 font-medium">
              Proceso de cobro
            </div>
            <div className="p-4 border-b border-r border-gray-100">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-600">
                  Automático. El paciente paga al reservar y vos recibís la
                  notificación sin intervención.
                </p>
              </div>
            </div>
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-600">
                  Manual. El paciente sube el comprobante y vos confirmás cada
                  turno.
                </p>
              </div>
            </div>

            {/* Confirmación del turno */}
            <div className="p-4 border-b border-r border-gray-100 text-gray-600 font-medium">
              Confirmación del turno
            </div>
            <div className="p-4 border-b border-r border-gray-100">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-600">
                  Inmediata al confirmar MP el pago.
                </p>
              </div>
            </div>
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-600">
                  Cuando vos confirmás el comprobante.
                </p>
              </div>
            </div>

            {/* Tiempo de acreditación */}
            <div className="p-4 border-b border-r border-gray-100 text-gray-600 font-medium">
              Acreditación
            </div>
            <div className="p-4 border-b border-r border-gray-100 text-xs text-gray-600">
              Inmediata con comisión ~6%. Menor comisión si esperás días hábiles
              (configurable en tu cuenta MP).
            </div>
            <div className="p-4 border-b border-gray-100 text-xs text-gray-600">
              Variable. Depende del banco del paciente (generalmente el mismo
              día o al día siguiente hábil).
            </div>

            {/* Seguridad */}
            <div className="p-4 border-b border-r border-gray-100 text-gray-600 font-medium">
              Seguridad
            </div>
            <div className="p-4 border-b border-r border-gray-100">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-600">
                  MP garantiza el pago. Disputas resueltas por su equipo.
                </p>
              </div>
            </div>
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-600">
                  Vos verificás el comprobante antes de confirmar.
                </p>
              </div>
            </div>

            {/* Ideal para */}
            <div className="p-4 border-r border-gray-100 text-gray-600 font-medium">
              Ideal para
            </div>
            <div className="p-4 border-r border-gray-100 text-xs text-gray-600">
              Profesionales con alto volumen de turnos que priorizan la
              automatización.
            </div>
            <div className="p-4 text-xs text-gray-600">
              Profesionales independientes que prefieren cero comisiones y
              control manual.
            </div>
          </div>
        </div>

        {/* Nota sobre comisión de MP */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-bold text-blue-900 mb-2">
            ¿Cómo funciona la comisión de Mercado Pago?
          </h2>
          <p className="text-sm text-blue-800 mb-3">
            Mercado Pago cobra una comisión por cada pago procesado. El
            porcentaje depende de cuándo querés recibir el dinero:
          </p>
          <ul className="space-y-1.5 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="font-semibold mt-0.5">•</span>
              <span>
                <strong>Retiro inmediato:</strong> ~6% + IVA. El dinero entra a
                tu cuenta de MP al instante.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold mt-0.5">•</span>
              <span>
                <strong>Retiro diferido:</strong> Menor comisión (varía según
                configuración). El dinero tarda más días en acreditarse.
              </span>
            </li>
          </ul>
          <p className="text-xs text-blue-600 mt-3">
            Podés configurar esto desde tu cuenta de Mercado Pago → Cuándo
            recibir el dinero.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">
            Podés cambiar tu método de cobro en cualquier momento desde tu
            perfil.
          </p>
          <a
            href="/onboarding"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg text-sm transition-colors"
          >
            Volver al onboarding
          </a>
        </div>
      </div>
    </main>
  );
}
