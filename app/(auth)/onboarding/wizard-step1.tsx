"use client";

import { useState } from "react";
import BioLinkPreview from "../../components/BioLinkPreview";
import PhotoUploader from "../../components/PhotoUploader";
import { Plus, X } from "lucide-react";

// Paletas predefinidas
const COLOR_PALETTES = [
  {
    id: "medical-blue",
    name: "Médico Azul",
    colors: { background: "#f0f9ff", text: "#0c4a6e", buttonBorder: "#0ea5e9", separator: "#38bdf8" },
  },
  {
    id: "warm-orange",
    name: "Cálido Naranja",
    colors: { background: "#fff7ed", text: "#7c2d12", buttonBorder: "#f97316", separator: "#fb923c" },
  },
  {
    id: "elegant-dark",
    name: "Elegante Oscuro",
    colors: { background: "#1e293b", text: "#f1f5f9", buttonBorder: "#94a3b8", separator: "#64748b" },
  },
  {
    id: "fresh-green",
    name: "Verde Fresco",
    colors: { background: "#f0fdf4", text: "#14532d", buttonBorder: "#22c55e", separator: "#4ade80" },
  },
  {
    id: "purple-modern",
    name: "Morado Moderno",
    colors: { background: "#faf5ff", text: "#581c87", buttonBorder: "#a855f7", separator: "#c084fc" },
  },
  {
    id: "clean-white",
    name: "Blanco Limpio",
    colors: { background: "#ffffff", text: "#111827", buttonBorder: "#d1d5db", separator: "#9ca3af" },
  },
];

interface WizardStep1Props {
  onNext: (data: any) => void;
  initialData?: any;
}

export default function WizardStep1({ onNext, initialData }: WizardStep1Props) {
  // Detectar paleta inicial basada en los colores guardados
  const detectPaletteFromColors = (colors: any) => {
    if (!colors) return COLOR_PALETTES[0].id;

    const matchingPalette = COLOR_PALETTES.find(
      (p) =>
        p.colors.background === colors.background &&
        p.colors.text === colors.text &&
        p.colors.buttonBorder === colors.buttonBorder
    );

    return matchingPalette?.id || COLOR_PALETTES[0].id;
  };

  const initialTheme = initialData?.tema_config || COLOR_PALETTES[0].colors;
  const initialPalette = detectPaletteFromColors(initialTheme);

  const [formData, setFormData] = useState({
    nombre_completo: initialData?.nombre_completo || "",
    especialidad: initialData?.especialidad || "",
    matricula: initialData?.matricula || "",
    descripcion: initialData?.descripcion || "",
    foto_url: initialData?.foto_url || "",
    monto_consulta: initialData?.monto_consulta || 10000,
    tema_config: initialTheme,
    botones_config: initialData?.botones_config || [],
  });

  const [selectedPalette, setSelectedPalette] = useState(initialPalette);
  const [showCustomColors, setShowCustomColors] = useState(false);
  const [newLink, setNewLink] = useState({ texto: "", url: "" });
  const [showAddLink, setShowAddLink] = useState(false);

  const handlePaletteChange = (paletteId: string) => {
    const palette = COLOR_PALETTES.find((p) => p.id === paletteId);
    if (palette) {
      setSelectedPalette(paletteId);
      setFormData({ ...formData, tema_config: palette.colors });
    }
  };

  const handleAddLink = () => {
    if (newLink.texto && newLink.url) {
      setFormData({
        ...formData,
        botones_config: [
          ...formData.botones_config,
          {
            id: `btn_${Date.now()}`,
            texto: newLink.texto,
            url: newLink.url,
            accion: "link",
            activo: true,
          },
        ],
      });
      setNewLink({ texto: "", url: "" });
      setShowAddLink(false);
    }
  };

  const handleRemoveLink = (index: number) => {
    setFormData({
      ...formData,
      botones_config: formData.botones_config.filter((_: any, i: number) => i !== index),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {/* Header Compacto */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <h1 className="text-xl font-bold text-gray-900">
              Configurá tu Identidad
            </h1>
          </div>
          <p className="text-sm text-gray-500 ml-4">
            Completá tus datos profesionales y personalizá tu biolink
          </p>
        </div>

        {/* Split Screen Layout - 60/40 */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* FORMULARIO - Izquierda (3 columnas = 60%) */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Información Personal */}
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                  Información Personal
                </h2>

                <div className="space-y-3">
                  {/* Foto de Perfil */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Foto de Perfil
                    </label>
                    <PhotoUploader
                      currentPhotoUrl={formData.foto_url}
                      onPhotoUploaded={(url) => setFormData({ ...formData, foto_url: url })}
                    />
                  </div>

                  {/* Nombre Completo */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre_completo}
                      onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                      placeholder="Juan Pérez"
                      required
                      className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Grid para Especialidad y Matrícula */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Especialidad *
                      </label>
                      <input
                        type="text"
                        value={formData.especialidad}
                        onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                        placeholder="Cardiología"
                        required
                        className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">
                        Matrícula *
                      </label>
                      <input
                        type="text"
                        value={formData.matricula}
                        onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                        placeholder="MN 12345"
                        required
                        className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Bio / Descripción
                    </label>
                    <textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      placeholder="Cuéntale a tus pacientes sobre tu experiencia..."
                      rows={2}
                      className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-0.5">Máximo 160 caracteres</p>
                  </div>

                  {/* Precio de Consulta */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      Precio de Consulta *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formData.monto_consulta ? formData.monto_consulta.toLocaleString('es-AR') : ''}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          setFormData({ ...formData, monto_consulta: value ? Number(value) : 0 });
                        }}
                        placeholder="10.000"
                        required
                        className="w-full pl-7 pr-12 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">ARS</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Separador */}
              <div className="border-t border-gray-200"></div>

              {/* Personalización */}
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                  Tema y Colores
                </h2>

                <div className="space-y-2">
                  <p className="text-xs text-gray-500 mb-2">
                    Elegí una paleta de colores para tu biolink
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {COLOR_PALETTES.map((palette) => (
                      <button
                        key={palette.id}
                        type="button"
                        onClick={() => handlePaletteChange(palette.id)}
                        className={`p-2 rounded-lg border transition-all ${
                          selectedPalette === palette.id
                            ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div
                            className="w-4 h-4 rounded-full border border-white shadow-sm"
                            style={{ backgroundColor: palette.colors.background }}
                          />
                          <div
                            className="w-4 h-4 rounded-full border border-white shadow-sm"
                            style={{ backgroundColor: palette.colors.separator }}
                          />
                          <div
                            className="w-4 h-4 rounded-full border border-white shadow-sm"
                            style={{ backgroundColor: palette.colors.buttonBorder }}
                          />
                        </div>
                        <p className="text-[10px] font-medium text-gray-700">{palette.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Separador */}
              <div className="border-t border-gray-200"></div>

              {/* Links Sociales */}
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                  Links y Redes Sociales
                </h2>

                <div className="space-y-2">
                  {/* Lista de links */}
                  {formData.botones_config.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      {formData.botones_config.map((btn: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">{btn.texto}</p>
                            <p className="text-[10px] text-gray-500 truncate">{btn.url}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveLink(index)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Agregar link */}
                  {!showAddLink ? (
                    <button
                      type="button"
                      onClick={() => setShowAddLink(true)}
                      className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-1.5 font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar Link
                    </button>
                  ) : (
                    <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <input
                        type="text"
                        value={newLink.texto}
                        onChange={(e) => setNewLink({ ...newLink, texto: e.target.value })}
                        placeholder="Texto del botón"
                        className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="url"
                        value={newLink.url}
                        onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleAddLink}
                          className="flex-1 bg-blue-600 text-white text-xs py-2 px-3 rounded-lg hover:bg-blue-700 font-medium"
                        >
                          Agregar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddLink(false);
                            setNewLink({ texto: "", url: "" });
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 text-xs font-medium"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Botón Siguiente */}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-sm"
              >
                Guardar y Continuar →
              </button>
            </form>
          </div>

          {/* PREVIEW - Derecha (2 columnas = 40%) */}
          <div className="lg:col-span-2 lg:sticky lg:top-6 lg:self-start">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Header del Preview */}
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-gray-700 font-semibold text-xs uppercase tracking-wide">Vista Previa</h3>
                  <span className="text-[10px] text-gray-400">Vista en vivo</span>
                </div>
              </div>

              {/* Preview Content - Simple frame */}
              <div className="p-4 bg-gray-50">
                <div className="mx-auto max-w-[300px]">
                  {/* Simple border frame */}
                  <div className="border-4 border-gray-300 rounded-3xl overflow-hidden shadow-lg bg-white">
                    <div
                      className="overflow-y-auto"
                      style={{
                        height: "580px",
                        scrollbarWidth: "thin",
                      }}
                    >
                      <BioLinkPreview data={formData} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
