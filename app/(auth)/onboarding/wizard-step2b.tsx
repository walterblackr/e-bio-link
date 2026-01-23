"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Clock, DollarSign, Calendar, CheckCircle, Info, ExternalLink } from "lucide-react";

interface Evento {
  id: string;
  nombre: string;
  descripcion: string;
  duracion_minutos: number;
  precio: number;
  activo: boolean;
}

interface WizardStep2BProps {
  onNext: () => void;
  onBack: () => void;
}

export default function WizardStep2B({ onNext, onBack }: WizardStep2BProps) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
  const [error, setError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    duracion_minutos: 30,
    precio: 0,
  });

  // Cargar eventos existentes
  useEffect(() => {
    loadEventos();
  }, []);

  const loadEventos = async () => {
    try {
      const res = await fetch("/api/eventos");
      const data = await res.json();

      if (res.ok) {
        setEventos(data.eventos || []);
      }
    } catch (err) {
      console.error("Error cargando eventos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFormLoading(true);

    try {
      const url = editingEvento
        ? `/api/eventos/${editingEvento.id}`
        : "/api/eventos";

      const method = editingEvento ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al guardar el evento");
      }

      // Recargar lista de eventos
      await loadEventos();

      // Resetear formulario
      setFormData({
        nombre: "",
        descripcion: "",
        duracion_minutos: 30,
        precio: 0,
      });
      setShowForm(false);
      setEditingEvento(null);

    } catch (err: any) {
      setError(err.message || "Error al guardar el evento");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (evento: Evento) => {
    setEditingEvento(evento);
    setFormData({
      nombre: evento.nombre,
      descripcion: evento.descripcion,
      duracion_minutos: evento.duracion_minutos,
      precio: evento.precio,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este evento?")) return;

    try {
      const res = await fetch(`/api/eventos/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Error al eliminar el evento");
      }

      await loadEventos();
    } catch (err: any) {
      setError(err.message || "Error al eliminar el evento");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEvento(null);
    setFormData({
      nombre: "",
      descripcion: "",
      duracion_minutos: 30,
      precio: 0,
    });
    setError("");
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[800px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <h1 className="text-xl font-bold text-gray-900">
              Configurá tus Eventos
            </h1>
          </div>
          <p className="text-sm text-gray-500 ml-4">
            Creá los tipos de consulta que ofrecés (admisión, control, urgencia, etc.)
          </p>
        </div>

        {/* Contenido */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="text-sm text-gray-500 mt-3">Cargando eventos...</p>
            </div>
          ) : (
            <>
              {/* Lista de Eventos */}
              {eventos.length > 0 && !showForm && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Eventos configurados ({eventos.length})
                  </h3>
                  <div className="space-y-2">
                    {eventos.map((evento) => (
                      <div
                        key={evento.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-gray-900">
                              {evento.nombre}
                            </h4>
                            {evento.activo && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                                <CheckCircle className="w-3 h-3" />
                                Activo
                              </span>
                            )}
                          </div>
                          {evento.descripcion && (
                            <p className="text-xs text-gray-600 mb-2">
                              {evento.descripcion}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {evento.duracion_minutos} min
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5" />
                              ${evento.precio.toLocaleString('es-AR')}
                            </div>
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

              {/* Información sobre configuración de horarios en Cal.com */}
              {eventos.length > 0 && !showForm && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-blue-900 mb-2">
                        Recordá configurar tus horarios disponibles en Cal.com
                      </h4>
                      <p className="text-xs text-blue-800 mb-3">
                        Ya creaste tus eventos, pero todavía necesitás configurar tus <strong>días y horarios de atención</strong> en Cal.com para que tus pacientes puedan reservar turnos.
                      </p>

                      <div className="space-y-2 mb-3">
                        <p className="text-xs text-blue-800 font-medium">📅 ¿Cómo configurar tus horarios?</p>
                        <ol className="list-decimal list-inside space-y-1 text-xs text-blue-800 ml-2">
                          <li>Andá a <strong>Settings → Availability</strong> en Cal.com</li>
                          <li>Configurá tus horarios de trabajo (días y horas)</li>
                          <li>Guardá los cambios</li>
                        </ol>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <a
                          href="https://app.cal.com/settings/my-account/general"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Ir a Cal.com Settings
                        </a>
                        <a
                          href="https://cal.com/help/availabilities/edit-availability"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Ver documentación
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Botón Agregar Evento */}
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all flex items-center justify-center gap-2 font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Agregar Nuevo Evento
                </button>
              )}

              {/* Formulario */}
              {showForm && (
                <div className="bg-purple-50 rounded-lg border border-purple-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    {editingEvento ? "Editar Evento" : "Nuevo Evento"}
                  </h3>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nombre */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Nombre del evento *
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

                    {/* Grid: Duración y Precio */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Duración */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Duración *
                        </label>
                        <select
                          value={formData.duracion_minutos}
                          onChange={(e) => setFormData({ ...formData, duracion_minutos: Number(e.target.value) })}
                          className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value={15}>15 minutos</option>
                          <option value={30}>30 minutos</option>
                          <option value={45}>45 minutos</option>
                          <option value={60}>60 minutos</option>
                          <option value={90}>90 minutos</option>
                        </select>
                      </div>

                      {/* Precio */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Precio *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formData.precio ? formData.precio.toLocaleString('es-AR') : ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9]/g, '');
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

                    {/* Error */}
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                      </div>
                    )}

                    {/* Botones */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleCancel}
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
                        {formLoading ? "Guardando..." : (editingEvento ? "Actualizar" : "Crear Evento")}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Info */}
              {eventos.length === 0 && !showForm && (
                <div className="text-center py-8 px-4">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    No tenés eventos configurados
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
                  Necesitás crear al menos un evento para continuar
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
