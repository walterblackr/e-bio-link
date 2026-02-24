"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Clock, Video, MapPin, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Evento {
  id: number;
  nombre: string;
  descripcion?: string;
  duracion_minutos: number;
  precio: number;
  modalidad: "virtual" | "presencial";
}

interface Medico {
  slug: string;
  nombre_completo: string;
  foto_url?: string;
  especialidad?: string;
  matricula?: string;
  descripcion?: string;
  tema_config?: any;
  payment_method: string;
}

interface Slot {
  start: string; // ISO
  label: string; // "HH:MM"
}

interface BookingFlowProps {
  medico: Medico;
  eventos: Evento[];
  diasActivos: number[]; // 0=Dom, 1=Lun, ..., 6=Sab
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function formatPrecio(precio: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(precio);
}

function formatFechaLarga(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${DIAS[date.getDay()]} ${d} de ${MESES[m - 1]} de ${y}`;
}


function toYMD(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function BookingFlow({ medico, eventos, diasActivos }: BookingFlowProps) {
  const router = useRouter();

  // Steps: 1=evento, 2=fecha+slot, 3=datos, 4=confirmación
  const [step, setStep] = useState(1);

  // Step 1
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);

  // Step 2
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // Step 3
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    notas: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Step 4 (submission)
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [bookingResult, setBookingResult] = useState<any>(null);

  // Step 4 - Mercado Pago
  const [mpLoading, setMpLoading] = useState(false);
  const [mpError, setMpError] = useState("");

  // Step 4 - Comprobante de transferencia
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
  const [comprobanteUploading, setComprobanteUploading] = useState(false);
  const [comprobanteDone, setComprobanteDone] = useState(false);
  const [comprobanteError, setComprobanteError] = useState("");

  // ── Load slots when date changes ──────────────────────────────────────────

  const fetchSlots = useCallback(async (date: string) => {
    if (!selectedEvento) return;
    setLoadingSlots(true);
    setSlotError("");
    setSlots([]);
    setSelectedSlot(null);

    try {
      const res = await fetch(
        `/api/slots/${medico.slug}?date=${date}&evento_id=${selectedEvento.id}`
      );
      const data = await res.json();

      if (!res.ok) {
        setSlotError(data.error || "Error al cargar horarios");
        return;
      }

      setSlots(data.slots || []);
      if ((data.slots || []).length === 0) {
        setSlotError("No hay turnos disponibles para esta fecha.");
      }
    } catch {
      setSlotError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoadingSlots(false);
    }
  }, [medico.slug, selectedEvento]);

  useEffect(() => {
    if (selectedDate && step === 2) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate, fetchSlots, step]);

  // ── Calendar helpers ──────────────────────────────────────────────────────

  function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay(); // 0=Sun
  }

  function isDatePast(year: number, month: number, day: number): boolean {
    const d = new Date(year, month, day);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return d < todayStart;
  }

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
    setSelectedDate(null);
    setSlots([]);
    setSlotError("");
  }

  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
    setSelectedDate(null);
    setSlots([]);
    setSlotError("");
  }

  // ── Form validation ───────────────────────────────────────────────────────

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!form.nombre.trim()) errors.nombre = "El nombre es requerido";
    if (!form.email.trim()) errors.email = "El email es requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Email inválido";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // ── Submit booking ────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!validateForm() || !selectedEvento || !selectedSlot) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/reservar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_slug: medico.slug,
          evento_id: selectedEvento.id,
          fecha_hora: selectedSlot.start,
          paciente_nombre: form.nombre,
          paciente_email: form.email,
          paciente_telefono: form.telefono || undefined,
          notas: form.notas || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || "Error al crear la reserva");
        return;
      }

      setBookingResult(data);
      setStep(4);
    } catch {
      setSubmitError("Error de conexión. Intenta nuevamente.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Pagar con Mercado Pago ────────────────────────────────────────────────

  async function handlePagarMP() {
    if (!bookingResult?.booking_id) return;
    setMpLoading(true);
    setMpError("");

    try {
      const res = await fetch("/api/crear-preferencia-pago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: bookingResult.booking_id,
          client_slug: medico.slug,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMpError(data.error || "Error al generar el link de pago");
        return;
      }

      // Redirigir a Mercado Pago
      window.location.href = data.init_point;
    } catch {
      setMpError("Error de conexión. Intenta nuevamente.");
    } finally {
      setMpLoading(false);
    }
  }

  // ── Subir comprobante de transferencia ────────────────────────────────────

  async function handleUploadComprobante() {
    if (!comprobanteFile || !bookingResult?.booking_id) return;
    setComprobanteUploading(true);
    setComprobanteError("");

    try {
      const formData = new FormData();
      formData.append("file", comprobanteFile);
      formData.append("booking_id", bookingResult.booking_id.toString());

      const res = await fetch("/api/upload-comprobante", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setComprobanteError(data.error || "Error al subir el comprobante");
        return;
      }

      setComprobanteDone(true);
    } catch {
      setComprobanteError("Error de conexión. Intenta nuevamente.");
    } finally {
      setComprobanteUploading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => {
              if (step === 1) router.back();
              else setStep(s => s - 1);
            }}
            className="p-2 rounded-full hover:bg-gray-100 transition text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{medico.nombre_completo}</p>
            {medico.especialidad && (
              <p className="text-xs text-gray-500 truncate">{medico.especialidad}</p>
            )}
          </div>
          {medico.foto_url && (
            <img
              src={medico.foto_url}
              alt={medico.nombre_completo}
              className="w-9 h-9 rounded-full object-cover border border-gray-200 flex-shrink-0"
            />
          )}
        </div>

        {/* Step indicator */}
        {step < 4 && (
          <div className="max-w-lg mx-auto px-4 pb-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      s < step
                        ? "bg-green-500 text-white"
                        : s === step
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {s < step ? <Check className="w-3 h-3" /> : s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`flex-1 h-0.5 w-12 ${s < step ? "bg-green-400" : "bg-gray-200"}`}
                    />
                  )}
                </div>
              ))}
              <span className="ml-2 text-xs text-gray-500">
                {step === 1 ? "Tipo de turno" : step === 2 ? "Fecha y hora" : "Tus datos"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6">

        {/* ─── STEP 1: Seleccionar evento ─────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">¿Qué tipo de turno necesitás?</h2>
            <p className="text-sm text-gray-500 mb-5">Seleccioná el tipo de consulta</p>

            <div className="space-y-3">
              {eventos.map((evento) => (
                <button
                  key={evento.id}
                  onClick={() => {
                    setSelectedEvento(evento);
                    setSelectedDate(null);
                    setSlots([]);
                    setSelectedSlot(null);
                    setStep(2);
                  }}
                  className="w-full text-left bg-white border-2 border-gray-200 hover:border-indigo-400 rounded-xl p-4 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                        {evento.nombre}
                      </p>
                      {evento.descripcion && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{evento.descripcion}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          {evento.duracion_minutos} min
                        </span>
                        <span
                          className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                            evento.modalidad === "virtual"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {evento.modalidad === "virtual" ? (
                            <Video className="w-3 h-3" />
                          ) : (
                            <MapPin className="w-3 h-3" />
                          )}
                          {evento.modalidad === "virtual" ? "Virtual" : "Presencial"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-gray-900 text-lg">{formatPrecio(evento.precio)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── STEP 2: Fecha y hora ───────────────────────────────────────── */}
        {step === 2 && selectedEvento && (
          <div>
            {/* Evento seleccionado (resumen) */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 mb-5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-indigo-900">{selectedEvento.nombre}</p>
                <p className="text-xs text-indigo-600">{selectedEvento.duracion_minutos} min · {formatPrecio(selectedEvento.precio)}</p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
              >
                Cambiar
              </button>
            </div>

            <h2 className="text-lg font-bold text-gray-900 mb-1">Elegí el día</h2>
            <p className="text-sm text-gray-500 mb-4">Seleccioná una fecha disponible</p>

            {/* Calendar */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h3 className="font-semibold text-gray-900">
                  {MESES[calMonth]} {calYear}
                </h3>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"].map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for offset */}
                {Array.from({ length: getFirstDayOfMonth(calYear, calMonth) }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {/* Day buttons */}
                {Array.from({ length: getDaysInMonth(calYear, calMonth) }, (_, i) => i + 1).map((day) => {
                  const dateStr = toYMD(calYear, calMonth, day);
                  const isPast = isDatePast(calYear, calMonth, day);
                  const isSelected = selectedDate === dateStr;
                  const diaSemana = new Date(calYear, calMonth, day).getDay();
                  const isAvailable = diasActivos.includes(diaSemana);
                  const isDisabled = isPast || !isAvailable;

                  return (
                    <button
                      key={day}
                      onClick={() => !isDisabled && setSelectedDate(dateStr)}
                      disabled={isDisabled}
                      className={`
                        aspect-square rounded-lg text-sm font-medium transition-all
                        ${isSelected
                          ? "bg-indigo-600 text-white shadow-sm"
                          : isDisabled
                            ? "text-gray-300 cursor-not-allowed"
                            : "bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-200 cursor-pointer"
                        }
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slots */}
            {selectedDate && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Horarios para {formatFechaLarga(selectedDate)}
                </p>

                {loadingSlots ? (
                  <div className="text-center py-6">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
                    <p className="text-sm text-gray-500 mt-2">Buscando disponibilidad...</p>
                  </div>
                ) : slotError ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-700">{slotError}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot.start}
                        onClick={() => setSelectedSlot(slot)}
                        className={`
                          py-2 px-1 rounded-lg text-sm font-medium border-2 transition-all
                          ${selectedSlot?.start === slot.start
                            ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                            : "border-gray-200 bg-white text-gray-700 hover:border-indigo-400"
                          }
                        `}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Continue button */}
            <div className="mt-6">
              <button
                onClick={() => setStep(3)}
                disabled={!selectedDate || !selectedSlot}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: Datos del paciente ─────────────────────────────────── */}
        {step === 3 && selectedEvento && selectedSlot && (
          <div>
            {/* Resumen del turno */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">Tu turno</p>
              <p className="font-semibold text-gray-900">{selectedEvento.nombre}</p>
              <p className="text-sm text-gray-600 mt-0.5">
                {selectedDate && formatFechaLarga(selectedDate)} · {selectedSlot.label} hs
              </p>
              <p className="text-sm font-bold text-indigo-700 mt-1">{formatPrecio(selectedEvento.precio)}</p>
            </div>

            <h2 className="text-lg font-bold text-gray-900 mb-4">Tus datos</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej: María García"
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    formErrors.nombre ? "border-red-400" : "border-gray-300"
                  }`}
                />
                {formErrors.nombre && <p className="text-xs text-red-500 mt-1">{formErrors.nombre}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="tu@email.com"
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    formErrors.email ? "border-red-400" : "border-gray-300"
                  }`}
                />
                {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono <span className="text-gray-400 text-xs">(opcional)</span>
                </label>
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                  placeholder="+54 9 11 1234-5678"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas / Motivo de consulta <span className="text-gray-400 text-xs">(opcional)</span>
                </label>
                <textarea
                  value={form.notas}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                  placeholder="Contanos brevemente el motivo de tu consulta..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>

            {submitError && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Confirmando...
                </>
              ) : (
                "Confirmar Turno →"
              )}
            </button>
          </div>
        )}

        {/* ─── STEP 4: Confirmación ───────────────────────────────────────── */}
        {step === 4 && bookingResult && selectedEvento && selectedSlot && (
          <div className="text-center">
            {/* Success icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Check className="w-10 h-10 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Turno reservado!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Número de reserva: <span className="font-mono font-semibold text-gray-700">#{bookingResult.booking_id}</span>
            </p>

            {/* Detalles del turno */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 text-left space-y-3">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Profesional</p>
                  <p className="font-semibold text-gray-900">{medico.nombre_completo}</p>
                  {medico.especialidad && <p className="text-xs text-gray-500">{medico.especialidad}</p>}
                </div>
                {medico.foto_url && (
                  <img src={medico.foto_url} alt="" className="w-12 h-12 rounded-full object-cover border border-gray-200 flex-shrink-0" />
                )}
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Turno</p>
                <p className="font-semibold text-gray-900">{selectedEvento.nombre}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Fecha y hora</p>
                <p className="font-semibold text-gray-900">
                  {selectedDate && formatFechaLarga(selectedDate)}
                </p>
                <p className="text-gray-700">{selectedSlot.label} hs · {selectedEvento.duracion_minutos} min</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Modalidad</p>
                <p className="font-semibold text-gray-900 capitalize">{selectedEvento.modalidad}</p>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Monto a abonar</p>
                <p className="text-2xl font-bold text-indigo-700">{formatPrecio(selectedEvento.precio)}</p>
              </div>
            </div>

            {/* Instrucciones de pago */}
            {bookingResult.payment_method === 'transfer' && bookingResult.transfer_data ? (
              <div className="mb-5 text-left space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                  <h3 className="font-semibold text-blue-900 mb-3">Datos para transferencia</h3>
                  <div className="space-y-2 text-sm">
                    {bookingResult.transfer_data.titular_cuenta && (
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-blue-700">Titular:</span>
                        <span className="font-semibold text-blue-900 text-right">{bookingResult.transfer_data.titular_cuenta}</span>
                      </div>
                    )}
                    {bookingResult.transfer_data.banco_nombre && (
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-blue-700">Banco:</span>
                        <span className="font-semibold text-blue-900 text-right">{bookingResult.transfer_data.banco_nombre}</span>
                      </div>
                    )}
                    {bookingResult.transfer_data.cbu_alias && (
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-blue-700">CBU/Alias:</span>
                        <span className="font-mono font-semibold text-blue-900 text-right break-all">{bookingResult.transfer_data.cbu_alias}</span>
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2 pt-2 border-t border-blue-200">
                      <span className="text-blue-700 font-semibold">Monto:</span>
                      <span className="font-bold text-blue-900">{formatPrecio(bookingResult.transfer_data.monto)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 mt-3">
                    Una vez realizada la transferencia, subí el comprobante para agilizar la confirmación.
                  </p>
                </div>

                {/* Upload comprobante */}
                {comprobanteDone ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-green-900">Comprobante enviado</p>
                      <p className="text-xs text-green-600">El profesional recibirá la notificación y confirmará tu turno.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-gray-900 mb-3">Subir comprobante de pago</p>
                    <label className="block mb-3">
                      <div className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                        comprobanteFile ? "border-indigo-400 bg-indigo-50" : "border-gray-300 hover:border-indigo-400"
                      }`}>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={e => setComprobanteFile(e.target.files?.[0] || null)}
                        />
                        {comprobanteFile ? (
                          <p className="text-sm text-indigo-700 font-medium truncate">{comprobanteFile.name}</p>
                        ) : (
                          <p className="text-sm text-gray-500">Tocá para seleccionar imagen o PDF</p>
                        )}
                      </div>
                    </label>
                    {comprobanteError && (
                      <p className="text-xs text-red-500 mb-2">{comprobanteError}</p>
                    )}
                    <button
                      onClick={handleUploadComprobante}
                      disabled={!comprobanteFile || comprobanteUploading}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                    >
                      {comprobanteUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Subiendo...
                        </>
                      ) : (
                        "Enviar comprobante"
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : bookingResult.payment_method === 'mp' ? (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-5 text-left">
                <h3 className="font-semibold text-indigo-900 mb-2">Pagá con Mercado Pago</h3>
                <p className="text-sm text-indigo-700 mb-4">
                  Completá el pago de {selectedEvento && formatPrecio(selectedEvento.precio)} de forma segura a través de Mercado Pago.
                </p>
                {mpError && (
                  <p className="text-xs text-red-500 mb-3">{mpError}</p>
                )}
                <button
                  onClick={handlePagarMP}
                  disabled={mpLoading}
                  className="w-full bg-[#009ee3] hover:bg-[#007eb5] disabled:bg-[#009ee3]/50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {mpLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generando link...
                    </>
                  ) : (
                    "Pagar con Mercado Pago →"
                  )}
                </button>
              </div>
            ) : null}

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5 text-left">
              <p className="text-xs text-gray-500">
                Recibirás la confirmación en <span className="font-semibold text-gray-700">{form.email}</span> una vez que el profesional confirme tu turno.
              </p>
            </div>

            <button
              onClick={() => router.push(`/biolink/${medico.slug}`)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Volver al perfil
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
