"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle } from "lucide-react";

interface DiaDisponibilidad {
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
}

const DIAS_SEMANA = [
  { num: 1, nombre: "Lunes" },
  { num: 2, nombre: "Martes" },
  { num: 3, nombre: "Miércoles" },
  { num: 4, nombre: "Jueves" },
  { num: 5, nombre: "Viernes" },
  { num: 6, nombre: "Sábado" },
  { num: 0, nombre: "Domingo" },
];

const HORAS_OPTIONS = [
  "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
  "19:00", "19:30", "20:00", "20:30", "21:00",
];


interface WizardStep3AvailabilityProps {
  onNext: () => void;
  onBack: () => void;
}

export default function WizardStep3Availability({ onNext, onBack }: WizardStep3AvailabilityProps) {
  const [dias, setDias] = useState<DiaDisponibilidad[]>(
    DIAS_SEMANA.map((d) => ({
      dia_semana: d.num,
      hora_inicio: "09:00",
      hora_fin: "17:00",
      activo: d.num >= 1 && d.num <= 5,
    }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDisponibilidad = async () => {
      try {
        const res = await fetch("/api/disponibilidad");
        const data = await res.json();

        if (res.ok && data.disponibilidad && data.disponibilidad.length > 0) {
          setDias((prev) =>
            prev.map((dia) => {
              const existing = data.disponibilidad.find(
                (d: any) => d.dia_semana === dia.dia_semana
              );
              if (existing) {
                return {
                  dia_semana: existing.dia_semana,
                  hora_inicio: existing.hora_inicio?.slice(0, 5) || "09:00",
                  hora_fin: existing.hora_fin?.slice(0, 5) || "17:00",
                  activo: existing.activo,
                };
              }
              return dia;
            })
          );
          setSaved(true);
        }
      } catch (err) {
        console.error("Error cargando disponibilidad:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDisponibilidad();
  }, []);

  const toggleDia = (diaSemana: number) => {
    setSaved(false);
    setDias((prev) =>
      prev.map((d) =>
        d.dia_semana === diaSemana ? { ...d, activo: !d.activo } : d
      )
    );
  };

  const updateHora = (diaSemana: number, field: "hora_inicio" | "hora_fin", value: string) => {
    setSaved(false);
    setDias((prev) =>
      prev.map((d) =>
        d.dia_semana === diaSemana ? { ...d, [field]: value } : d
      )
    );
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);

    for (const dia of dias) {
      if (dia.activo && dia.hora_inicio >= dia.hora_fin) {
        const nombre = DIAS_SEMANA.find((d) => d.num === dia.dia_semana)?.nombre;
        setError(`${nombre}: la hora de inicio debe ser menor a la hora de fin`);
        setSaving(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/disponibilidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dias }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }

      setSaved(true);
    } catch (err: any) {
      setError(err.message || "Error al guardar la disponibilidad");
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    const diasActivos = dias.filter((d) => d.activo);
    if (diasActivos.length === 0) {
      setError("Seleccioná al menos un día de atención");
      return;
    }
    if (!saved) {
      setError("Guardá tus horarios antes de continuar");
      return;
    }
    onNext();
  };

  const diasActivos = dias.filter((d) => d.activo).length;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[800px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <h1 className="text-xl font-bold text-gray-900">
              Configurá tu Disponibilidad
            </h1>
          </div>
          <p className="text-sm text-gray-500 ml-4">
            Seleccioná los días y horarios en los que atendés pacientes
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="text-sm text-gray-500 mt-3">Cargando disponibilidad...</p>
            </div>
          ) : (
            <>
              {/* Resumen */}
              <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-xs text-purple-800">
                  <strong>{diasActivos}</strong> {diasActivos === 1 ? "día" : "días"} de atención configurados. Tocá cada día para activar o desactivar.
                </p>
              </div>

                {/* Grilla de Días */}
                <div className="space-y-2">
                  {DIAS_SEMANA.map((diaSemana) => {
                    const dia = dias.find((d) => d.dia_semana === diaSemana.num)!;
                    return (
                      <div
                        key={diaSemana.num}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                          dia.activo
                            ? "bg-green-50 border-green-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        {/* Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleDia(diaSemana.num)}
                          className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                            dia.activo ? "bg-green-500" : "bg-gray-300"
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              dia.activo ? "translate-x-5" : "translate-x-0.5"
                            }`}
                          />
                        </button>

                        {/* Nombre del día */}
                        <span className={`text-sm font-medium w-24 ${
                          dia.activo ? "text-gray-900" : "text-gray-400"
                        }`}>
                          {diaSemana.nombre}
                        </span>

                        {/* Horarios */}
                        {dia.activo ? (
                          <div className="flex items-center gap-2 flex-1">
                            <select
                              value={dia.hora_inicio}
                              onChange={(e) => updateHora(diaSemana.num, "hora_inicio", e.target.value)}
                              className="px-2 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                              {HORAS_OPTIONS.map((h) => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                            <span className="text-xs text-gray-400">a</span>
                            <select
                              value={dia.hora_fin}
                              onChange={(e) => updateHora(diaSemana.num, "hora_fin", e.target.value)}
                              className="px-2 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                              {HORAS_OPTIONS.map((h) => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No atiende</span>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Botón Guardar */}
              <button
                onClick={handleSave}
                disabled={saving || diasActivos === 0}
                className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                  saved
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : "bg-purple-600 hover:bg-purple-700 text-white disabled:bg-purple-300 disabled:cursor-not-allowed"
                }`}
              >
                {saving ? (
                  "Guardando..."
                ) : saved ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Horarios guardados
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4" />
                    Guardar Horarios
                  </>
                )}
              </button>

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
                  className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors text-sm"
                >
                  ← Anterior
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={diasActivos === 0 || !saved || saving}
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
