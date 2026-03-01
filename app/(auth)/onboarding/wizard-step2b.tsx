"use client";

import { useState, useEffect } from "react";
import {
  Plus, Edit2, Trash2, Clock, DollarSign, Calendar,
  CheckCircle, ChevronDown, ChevronUp, Settings
} from "lucide-react";

interface BloqueHorario {
  hora_inicio: string;
  hora_fin: string;
}

interface DiaDisponibilidad {
  dia_semana: number;
  activo: boolean;
  bloques: BloqueHorario[];
}

interface Evento {
  id: string;
  nombre: string;
  descripcion: string;
  duracion_minutos: number;
  precio: number;
  modalidad: string;
  activo: boolean;
  buffer_despues: number;
  antelacion_minima: number;
  max_por_dia: number | null;
}

interface WizardStep2BProps {
  onNext: () => void;
  onBack: () => void;
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
  "07:00","07:30","08:00","08:30","09:00","09:30",
  "10:00","10:30","11:00","11:30","12:00","12:30",
  "13:00","13:30","14:00","14:30","15:00","15:30",
  "16:00","16:30","17:00","17:30","18:00","18:30",
  "19:00","19:30","20:00","20:30","21:00",
];

const DURACIONES = [15, 20, 30, 45, 60, 90];
const BUFFERS = [0, 5, 10, 15, 20, 30];

const defaultDias = (): DiaDisponibilidad[] =>
  DIAS_SEMANA.map((d) => ({
    dia_semana: d.num,
    activo: d.num >= 1 && d.num <= 5,
    bloques: [{ hora_inicio: "09:00", hora_fin: "17:00" }],
  }));

export default function WizardStep2B({ onNext, onBack }: WizardStep2BProps) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [showAvanzado, setShowAvanzado] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    duracion_minutos: 30,
    precio: 0,
    modalidad: "virtual",
    buffer_despues: 0,
    antelacion_minima: 0,   // stored in minutes
    max_por_dia: "" as string, // "" = sin límite
  });

  const [dias, setDias] = useState<DiaDisponibilidad[]>(defaultDias());

  useEffect(() => {
    loadEventos();
  }, []);

  const loadEventos = async () => {
    try {
      const res = await fetch("/api/eventos");
      const data = await res.json();
      if (res.ok) setEventos(data.eventos || []);
    } catch (err) {
      console.error("Error cargando eventos:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Disponibilidad helpers ──────────────────────────────────────────────

  const toggleDia = (diaSemana: number) => {
    setDias((prev) =>
      prev.map((d) =>
        d.dia_semana === diaSemana ? { ...d, activo: !d.activo } : d
      )
    );
  };

  const agregarBloque = (diaSemana: number) => {
    setDias((prev) =>
      prev.map((d) => {
        if (d.dia_semana !== diaSemana) return d;
        // El nuevo bloque empieza donde termina el último
        const ultimo = d.bloques[d.bloques.length - 1];
        const nuevaInicio = ultimo?.hora_fin || "09:00";
        const inicioIdx = HORAS_OPTIONS.indexOf(nuevaInicio);
        const nuevaFin = HORAS_OPTIONS[Math.min(inicioIdx + 2, HORAS_OPTIONS.length - 1)];
        return { ...d, bloques: [...d.bloques, { hora_inicio: nuevaInicio, hora_fin: nuevaFin }] };
      })
    );
  };

  const eliminarBloque = (diaSemana: number, bloqueIdx: number) => {
    setDias((prev) =>
      prev.map((d) => {
        if (d.dia_semana !== diaSemana) return d;
        const nuevos = d.bloques.filter((_, i) => i !== bloqueIdx);
        return { ...d, bloques: nuevos.length > 0 ? nuevos : d.bloques };
      })
    );
  };

  const updateBloque = (
    diaSemana: number,
    bloqueIdx: number,
    field: "hora_inicio" | "hora_fin",
    value: string
  ) => {
    setDias((prev) =>
      prev.map((d) => {
        if (d.dia_semana !== diaSemana) return d;
        const nuevos = d.bloques.map((b, i) =>
          i === bloqueIdx ? { ...b, [field]: value } : b
        );
        return { ...d, bloques: nuevos };
      })
    );
  };

  const validarDisponibilidad = (): string | null => {
    for (const dia of dias) {
      if (!dia.activo) continue;
      for (const b of dia.bloques) {
        if (b.hora_inicio >= b.hora_fin) {
          const nombre = DIAS_SEMANA.find((d) => d.num === dia.dia_semana)?.nombre;
          return `${nombre}: la hora de inicio debe ser menor a la hora de fin`;
        }
      }
      if (dia.bloques.length > 1) {
        const sorted = [...dia.bloques].sort((a, b) =>
          a.hora_inicio.localeCompare(b.hora_inicio)
        );
        for (let i = 0; i < sorted.length - 1; i++) {
          if (sorted[i].hora_fin > sorted[i + 1].hora_inicio) {
            const nombre = DIAS_SEMANA.find((d) => d.num === dia.dia_semana)?.nombre;
            return `${nombre}: los bloques horarios se superponen`;
          }
        }
      }
    }
    if (!dias.some((d) => d.activo)) {
      return "Seleccioná al menos un día de disponibilidad";
    }
    return null;
  };

  // ── Guardar evento ──────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const dispError = validarDisponibilidad();
    if (dispError) {
      setError(dispError);
      return;
    }

    setFormLoading(true);

    try {
      const payload = {
        ...formData,
        antelacion_minima: Number(formData.antelacion_minima) || 0,
        max_por_dia: formData.max_por_dia !== "" ? Number(formData.max_por_dia) : null,
      };

      const url = editingEvento ? `/api/eventos/${editingEvento.id}` : "/api/eventos";
      const method = editingEvento ? "PUT" : "POST";

      const eventoRes = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const eventoData = await eventoRes.json();

      if (!eventoRes.ok) {
        throw new Error(eventoData.error || "Error al guardar el evento");
      }

      const eventoId = eventoData.evento?.id || editingEvento?.id;

      // Guardar disponibilidad del evento
      const dispRes = await fetch("/api/disponibilidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evento_id: eventoId, dias }),
      });

      if (!dispRes.ok) {
        const dispData = await dispRes.json();
        throw new Error(dispData.error || "Error al guardar disponibilidad");
      }

      await loadEventos();
      resetForm();
    } catch (err: any) {
      setError(err.message || "Error al guardar el evento");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Editar evento ───────────────────────────────────────────────────────

  const handleEdit = async (evento: Evento) => {
    setEditingEvento(evento);
    setFormData({
      nombre: evento.nombre,
      descripcion: evento.descripcion || "",
      duracion_minutos: evento.duracion_minutos,
      precio: evento.precio,
      modalidad: evento.modalidad || "virtual",
      buffer_despues: evento.buffer_despues ?? 0,
      antelacion_minima: evento.antelacion_minima ?? 0,
      max_por_dia: evento.max_por_dia !== null && evento.max_por_dia !== undefined
        ? String(evento.max_por_dia)
        : "",
    });
    setShowAvanzado(
      (evento.buffer_despues ?? 0) > 0 ||
      (evento.antelacion_minima ?? 0) > 0 ||
      evento.max_por_dia !== null
    );

    // Cargar disponibilidad del evento
    try {
      const res = await fetch(`/api/disponibilidad?evento_id=${evento.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.disponibilidad && data.disponibilidad.length > 0) {
          // Reconstruir desde respuesta API
          const newDias = defaultDias().map((d) => {
            const found = data.disponibilidad.find(
              (x: any) => x.dia_semana === d.dia_semana
            );
            if (found) {
              return {
                dia_semana: d.dia_semana,
                activo: found.activo,
                bloques: found.bloques,
              };
            }
            return { ...d, activo: false };
          });
          setDias(newDias);
        } else {
          setDias(defaultDias().map((d) => ({ ...d, activo: false })));
        }
      }
    } catch {
      setDias(defaultDias());
    }

    setShowForm(true);
  };

  // ── Eliminar evento ─────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este evento?")) return;
    try {
      const res = await fetch(`/api/eventos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar el evento");
      await loadEventos();
    } catch (err: any) {
      setError(err.message || "Error al eliminar el evento");
    }
  };

  // ── Resetear form ───────────────────────────────────────────────────────

  const resetForm = () => {
    setShowForm(false);
    setEditingEvento(null);
    setShowAvanzado(false);
    setFormData({
      nombre: "",
      descripcion: "",
      duracion_minutos: 30,
      precio: 0,
      modalidad: "virtual",
      buffer_despues: 0,
      antelacion_minima: 0,
      max_por_dia: "",
    });
    setDias(defaultDias());
    setError("");
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[800px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <h1 className="text-xl font-bold text-gray-900">Configurá tus Consultas</h1>
          </div>
          <p className="text-sm text-gray-500 ml-4">
            Creá los tipos de consulta con sus horarios, duración y precio
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="text-sm text-gray-500 mt-3">Cargando consultas...</p>
            </div>
          ) : (
            <>
              {/* Lista de Eventos */}
              {eventos.length > 0 && !showForm && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Consultas configuradas ({eventos.length})
                  </h3>
                  <div className="space-y-2">
                    {eventos.map((evento) => (
                      <div
                        key={evento.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-gray-900">{evento.nombre}</h4>
                            {evento.activo && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                                <CheckCircle className="w-3 h-3" />
                                Activo
                              </span>
                            )}
                          </div>
                          {evento.descripcion && (
                            <p className="text-xs text-gray-600 mb-2">{evento.descripcion}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {evento.duracion_minutos} min
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5" />
                              ${Number(evento.precio).toLocaleString("es-AR")}
                            </div>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                              evento.modalidad === "presencial"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-blue-100 text-blue-700"
                            }`}>
                              {evento.modalidad === "presencial" ? "Presencial" : "Virtual"}
                            </span>
                            {(evento.buffer_despues ?? 0) > 0 && (
                              <span className="inline-flex items-center gap-1 text-gray-400">
                                <Settings className="w-3 h-3" />
                                buffer
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleEdit(evento)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(evento.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón Agregar */}
              {!showForm && (
                <button
                  onClick={() => { setDias(defaultDias()); setShowForm(true); }}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all flex items-center justify-center gap-2 font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Agregar Nueva Consulta
                </button>
              )}

              {/* Formulario */}
              {showForm && (
                <div className="bg-purple-50 rounded-lg border border-purple-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    {editingEvento ? "Editar Consulta" : "Nueva Consulta"}
                  </h3>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* ── Info básica ─────────────────────────── */}
                    <div className="space-y-4">
                      {/* Nombre */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Nombre de la consulta *
                        </label>
                        <input
                          type="text"
                          value={formData.nombre}
                          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                          placeholder="ej: Admisión, Control Mensual, Urgencia"
                          required
                          className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>

                      {/* Descripción */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Descripción (opcional)
                        </label>
                        <textarea
                          value={formData.descripcion}
                          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                          placeholder="Breve descripción del tipo de consulta"
                          rows={2}
                          className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        />
                      </div>

                      {/* Duración y Precio */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            Duración *
                          </label>
                          <select
                            value={formData.duracion_minutos}
                            onChange={(e) => setFormData({ ...formData, duracion_minutos: Number(e.target.value) })}
                            className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            {DURACIONES.map((d) => (
                              <option key={d} value={d}>{d} minutos</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            Precio *
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={formData.precio ? Number(formData.precio).toLocaleString("es-AR") : ""}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, "");
                                setFormData({ ...formData, precio: value ? Number(value) : 0 });
                              }}
                              placeholder="10.000"
                              required
                              className="w-full pl-7 pr-12 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">ARS</span>
                          </div>
                        </div>
                      </div>

                      {/* Modalidad */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Modalidad *
                        </label>
                        <div className="flex gap-3">
                          {(["virtual", "presencial"] as const).map((mod) => (
                            <label key={mod} className={`flex-1 flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                              formData.modalidad === mod
                                ? "bg-purple-50 border-purple-400"
                                : "bg-white border-gray-300 hover:border-gray-400"
                            }`}>
                              <input
                                type="radio"
                                name="modalidad"
                                value={mod}
                                checked={formData.modalidad === mod}
                                onChange={(e) => setFormData({ ...formData, modalidad: e.target.value })}
                                className="text-purple-600 focus:ring-purple-500"
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {mod === "virtual" ? "Virtual" : "Presencial"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {mod === "virtual" ? "Google Meet" : "En consultorio"}
                                </p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* ── Disponibilidad ──────────────────────── */}
                    <div className="border-t border-purple-200 pt-4">
                      <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-purple-500" />
                        Disponibilidad
                      </h4>

                      <div className="space-y-2">
                        {DIAS_SEMANA.map(({ num, nombre }) => {
                          const dia = dias.find((d) => d.dia_semana === num)!;
                          return (
                            <div
                              key={num}
                              className={`rounded-lg border transition-all ${
                                dia.activo ? "bg-white border-purple-200" : "bg-gray-50 border-gray-200"
                              }`}
                            >
                              {/* Fila del día */}
                              <div className="flex items-center gap-3 p-3">
                                <button
                                  type="button"
                                  onClick={() => toggleDia(num)}
                                  className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                                    dia.activo ? "bg-purple-500" : "bg-gray-300"
                                  }`}
                                >
                                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                    dia.activo ? "translate-x-5" : "translate-x-0.5"
                                  }`} />
                                </button>
                                <span className={`text-sm font-medium w-24 flex-shrink-0 ${
                                  dia.activo ? "text-gray-900" : "text-gray-400"
                                }`}>
                                  {nombre}
                                </span>
                                {!dia.activo && (
                                  <span className="text-xs text-gray-400 italic">No atiende</span>
                                )}
                                {dia.activo && dia.bloques.length > 1 && (
                                  <span className="text-xs text-purple-600 font-medium">
                                    {dia.bloques.length} bloques
                                  </span>
                                )}
                              </div>

                              {/* Bloques del día */}
                              {dia.activo && (
                                <div className="px-3 pb-3 space-y-2">
                                  {dia.bloques.map((bloque, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                      <select
                                        value={bloque.hora_inicio}
                                        onChange={(e) => updateBloque(num, idx, "hora_inicio", e.target.value)}
                                        className="px-2 py-1.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                      >
                                        {HORAS_OPTIONS.map((h) => (
                                          <option key={h} value={h}>{h}</option>
                                        ))}
                                      </select>
                                      <span className="text-xs text-gray-400 flex-shrink-0">a</span>
                                      <select
                                        value={bloque.hora_fin}
                                        onChange={(e) => updateBloque(num, idx, "hora_fin", e.target.value)}
                                        className="px-2 py-1.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                      >
                                        {HORAS_OPTIONS.map((h) => (
                                          <option key={h} value={h}>{h}</option>
                                        ))}
                                      </select>
                                      {dia.bloques.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => eliminarBloque(num, idx)}
                                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                                          title="Eliminar bloque"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => agregarBloque(num)}
                                    className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium mt-1"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    Agregar bloque
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* ── Configuración avanzada ──────────────── */}
                    <div className="border-t border-purple-200 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowAvanzado(!showAvanzado)}
                        className="flex items-center justify-between w-full text-xs font-semibold text-gray-700 uppercase tracking-wide"
                      >
                        <span className="flex items-center gap-1.5">
                          <Settings className="w-3.5 h-3.5 text-gray-400" />
                          Configuración avanzada
                        </span>
                        {showAvanzado ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>

                      {showAvanzado && (
                        <div className="mt-4 space-y-3">
                          {/* Buffer entre consultas */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              Buffer entre consultas (min)
                            </label>
                            <select
                              value={formData.buffer_despues}
                              onChange={(e) => setFormData({ ...formData, buffer_despues: Number(e.target.value) })}
                              className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                              {BUFFERS.map((b) => (
                                <option key={b} value={b}>{b === 0 ? "Sin buffer" : `${b} min`}</option>
                              ))}
                            </select>
                            <p className="text-xs text-gray-400 mt-1">
                              Tiempo libre entre turnos. Ej: duración 45 min + buffer 15 min = turnos cada 60 min.
                            </p>
                          </div>

                          {/* Antelación mínima */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              Antelación mínima para reservar
                            </label>
                            <select
                              value={formData.antelacion_minima}
                              onChange={(e) => setFormData({ ...formData, antelacion_minima: Number(e.target.value) })}
                              className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                              <option value={0}>Sin antelación (reservas inmediatas)</option>
                              <option value={30}>30 minutos</option>
                              <option value={60}>1 hora</option>
                              <option value={120}>2 horas</option>
                              <option value={240}>4 horas</option>
                              <option value={480}>8 horas</option>
                              <option value={1440}>24 horas (1 día)</option>
                              <option value={2880}>48 horas (2 días)</option>
                            </select>
                            <p className="text-xs text-gray-400 mt-1">
                              Tiempo mínimo de anticipación que necesita un paciente para reservar
                            </p>
                          </div>

                          {/* Máximo por día */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              Máximo de turnos por día
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={formData.max_por_dia}
                              onChange={(e) => {
                                const v = e.target.value.replace(/[^0-9]/g, "");
                                setFormData({ ...formData, max_por_dia: v });
                              }}
                              placeholder="Sin límite"
                              className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                              Dejá vacío para sin límite. Ej: 5 acepta solo 5 turnos de este tipo por día.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                      </div>
                    )}

                    {/* Botones del formulario */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={resetForm}
                        disabled={formLoading}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={formLoading}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        {formLoading
                          ? "Guardando..."
                          : editingEvento
                          ? "Actualizar"
                          : "Crear Consulta"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Empty state */}
              {eventos.length === 0 && !showForm && (
                <div className="text-center py-8 px-4">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    No tenés consultas configuradas
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Creá al menos un tipo de consulta para que tus pacientes puedan reservar turnos
                  </p>
                </div>
              )}

              {/* Navegación */}
              <div className="flex gap-3 mt-6 pt-6 border-t">
                <button
                  type="button"
                  onClick={onBack}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors text-sm"
                >
                  ← Anterior
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  disabled={eventos.length === 0}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors text-sm"
                >
                  Continuar →
                </button>
              </div>

              {eventos.length === 0 && (
                <p className="text-xs text-center text-gray-500 mt-3">
                  Necesitás crear al menos una consulta para continuar
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
