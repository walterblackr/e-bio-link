"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import WizardStep1 from "./wizard-step1";
import WizardStep2Google from "./wizard-step2-google";
import WizardStep3Availability from "./wizard-step3-availability";
import WizardStep2B from "./wizard-step2b";
import WizardStep5Payment from "./wizard-step5-payment";

interface OnboardingWizardProps {
  clientData: any;
}

export default function OnboardingWizard({ clientData }: OnboardingWizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Si volvemos del OAuth de Google, arrancamos en el paso 2
  const initialStep = searchParams?.get("google") === "connected" ? 2 : 1;
  const [currentStep, setCurrentStep] = useState(initialStep);

  useEffect(() => {
    if (searchParams?.get("google") === "connected") {
      window.history.replaceState({}, "", "/onboarding");
    }
  }, []);
  const [step1Data, setStep1Data] = useState<any>(null);
  const [currentClientData, setCurrentClientData] = useState(clientData);

  const TOTAL_STEPS = 5;

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
      setCurrentClientData({ ...currentClientData, ...data });
      setCurrentStep(2);
    } catch (error: any) {
      alert(error.message || "Error al guardar los datos");
    }
  };

  const stepLabels: Record<number, string> = {
    1: "Identidad",
    2: "Google Calendar",
    3: "Disponibilidad",
    4: "Eventos",
    5: "Método de Pago",
  };

  return (
    <div>
      {/* Progress Indicator */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                    step === currentStep
                      ? "bg-blue-600 text-white"
                      : step < currentStep
                      ? "bg-green-500 text-white"
                      : "bg-gray-300 text-black"
                  }`}
                >
                  {step < currentStep ? "\u2713" : step}
                </div>
                {step < TOTAL_STEPS && (
                  <div
                    className={`w-8 sm:w-12 h-1 mx-1 ${
                      step < currentStep ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-2">
            <p className="text-sm text-gray-600">
              Paso {currentStep}: {stepLabels[currentStep]}
            </p>
          </div>
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 1 && (
        <WizardStep1
          onNext={handleStep1Next}
          initialData={{
            nombre_completo: currentClientData.nombre_completo || "",
            especialidad: currentClientData.especialidad || "",
            matricula: currentClientData.matricula || "",
            descripcion: currentClientData.descripcion || "",
            foto_url: currentClientData.foto_url || "",
            monto_consulta: currentClientData.monto_consulta || 10000,
            tema_config: typeof currentClientData.tema_config === 'string'
              ? JSON.parse(currentClientData.tema_config)
              : currentClientData.tema_config || undefined,
            botones_config: typeof currentClientData.botones_config === 'string'
              ? JSON.parse(currentClientData.botones_config)
              : currentClientData.botones_config || [],
          }}
        />
      )}

      {currentStep === 2 && (
        <WizardStep2Google
          onNext={() => setCurrentStep(3)}
          onBack={() => setCurrentStep(1)}
        />
      )}

      {currentStep === 3 && (
        <WizardStep3Availability
          onNext={() => setCurrentStep(4)}
          onBack={() => setCurrentStep(2)}
        />
      )}

      {currentStep === 4 && (
        <WizardStep2B
          onNext={() => setCurrentStep(5)}
          onBack={() => setCurrentStep(3)}
        />
      )}

      {currentStep === 5 && (
        <WizardStep5Payment
          onNext={() => router.push(`/biolink/${currentClientData.slug}`)}
          onBack={() => setCurrentStep(4)}
          clientSlug={currentClientData.slug}
        />
      )}
    </div>
  );
}
