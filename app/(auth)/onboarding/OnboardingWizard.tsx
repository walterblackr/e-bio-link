"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import WizardStep1 from "./wizard-step1";
import WizardStep2Google from "./wizard-step2-google";
import WizardStep2B from "./wizard-step2b";
import WizardStep5Payment from "./wizard-step5-payment";

interface OnboardingWizardProps {
  clientData: any;
}

export default function OnboardingWizard({ clientData }: OnboardingWizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Detectar desde dónde viene el médico
  const fromPanel = searchParams?.get("from") === "panel";
  const stepParam = parseInt(searchParams?.get("step") || "1");

  // Prioridad: google=connected → step 2 | ?step=X → ese step | default → 1
  const computedInitialStep = searchParams?.get("google") === "connected"
    ? 2
    : (stepParam >= 1 && stepParam <= 4 ? stepParam : 1);

  const [currentStep, setCurrentStep] = useState(computedInitialStep);

  useEffect(() => {
    if (searchParams?.get("google") === "connected") {
      window.history.replaceState({}, "", "/onboarding");
    }
  }, []);

  const [currentClientData, setCurrentClientData] = useState(clientData);

  const TOTAL_STEPS = 4;

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

      setCurrentClientData({ ...currentClientData, ...data });
      setCurrentStep(2);
    } catch (error: any) {
      alert(error.message || "Error al guardar los datos");
    }
  };

  const stepLabels: Record<number, string> = {
    1: "Identidad",
    2: "Google Calendar",
    3: "Consultas",
    4: "Método de Pago",
  };

  return (
    <div>
      {/* Progress Indicator */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {fromPanel && (
            <div style={{ marginBottom: '12px' }}>
              <Link href="/panel" style={{ fontSize: '13px', color: '#6366f1', textDecoration: 'none', fontWeight: 500 }}>
                ← Volver al panel
              </Link>
            </div>
          )}
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
        <WizardStep2B
          onNext={() => setCurrentStep(4)}
          onBack={() => setCurrentStep(2)}
        />
      )}

      {currentStep === 4 && (
        <WizardStep5Payment
          onNext={() => router.push(fromPanel ? '/panel' : `/biolink/${currentClientData.slug}`)}
          onBack={() => setCurrentStep(3)}
          clientSlug={currentClientData.slug}
        />
      )}
    </div>
  );
}
