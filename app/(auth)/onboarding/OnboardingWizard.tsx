"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import WizardStep1 from "./wizard-step1";
import WizardStep2 from "./wizard-step2";

interface OnboardingWizardProps {
  clientData: any;
}

export default function OnboardingWizard({ clientData }: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState<any>(null);

  const handleStep1Next = async (data: any) => {
    try {
      const res = await fetch("/api/onboarding/step1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al guardar los datos");
      }

      setStep1Data(data);
      setCurrentStep(2);
    } catch (error: any) {
      alert(error.message || "Error al guardar los datos");
    }
  };

  return (
    <div>
      {/* Progress Indicator */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    step === currentStep
                      ? "bg-blue-600 text-white"
                      : step < currentStep
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step < currentStep ? "✓" : step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      step < currentStep ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-2">
            <p className="text-sm text-gray-600">
              {currentStep === 1 && "Paso 1: Configurá tu Identidad"}
              {currentStep === 2 && "Paso 2: Configurá tu Agenda"}
              {currentStep === 3 && "Paso 3: Conectá Mercado Pago"}
            </p>
          </div>
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 1 && (
        <WizardStep1
          onNext={handleStep1Next}
          initialData={{
            nombre_completo: clientData.nombre_completo || "",
            especialidad: clientData.especialidad || "",
            matricula: clientData.matricula || "",
            descripcion: clientData.descripcion || "",
            foto_url: clientData.foto_url || "",
            monto_consulta: clientData.monto_consulta || 10000,
            tema_config: clientData.tema_config || undefined,
            botones_config: clientData.botones_config || [],
          }}
        />
      )}

      {currentStep === 2 && (
        <WizardStep2
          onNext={() => setCurrentStep(3)}
          onBack={() => setCurrentStep(1)}
          clientData={clientData}
        />
      )}

      {currentStep === 3 && (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Paso 3: Conectá Mercado Pago
            </h2>
            <p className="text-gray-600 mb-6">
              Próximamente podrás conectar tu cuenta de Mercado Pago aquí
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition"
              >
                ← Volver
              </button>
              <button
                onClick={() => router.push(`/biolink/${clientData.slug}`)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                Finalizar ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
