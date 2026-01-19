"use client";

// Componente de preview para el onboarding (versión simplificada del BioLinkTemplate)
interface BioLinkPreviewProps {
  data: {
    nombre_completo: string;
    foto_url: string;
    especialidad: string;
    matricula: string;
    descripcion: string;
    monto_consulta: number;
    botones_config: any[];
    tema_config: {
      background?: string;
      text?: string;
      buttonBorder?: string;
      separator?: string;
    };
  };
}

export default function BioLinkPreview({ data }: BioLinkPreviewProps) {
  const colors = {
    background: data.tema_config.background || "#f8fafc",
    text: data.tema_config.text || "#0e0d0dff",
    buttonBorder: data.tema_config.buttonBorder || "#ffffff",
    separator: data.tema_config.separator || "#6ba1f2",
  };

  const buttons = Array.isArray(data.botones_config) ? data.botones_config : [];

  return (
    <div
      className="w-full h-full overflow-y-auto"
      style={{ backgroundColor: colors.background }}
    >
      <div className="min-h-full py-8 px-6 flex flex-col items-center">
        {/* Foto de Perfil */}
        {data.foto_url ? (
          <img
            src={data.foto_url}
            alt={data.nombre_completo || "Perfil"}
            className="w-24 h-24 rounded-full object-cover mb-4 shadow-lg"
          />
        ) : (
          <div
            className="w-24 h-24 rounded-full mb-4 shadow-lg flex items-center justify-center text-4xl"
            style={{ backgroundColor: colors.separator, color: colors.background }}
          >
            👤
          </div>
        )}

        {/* Nombre */}
        <h1
          className="text-2xl font-bold mb-1 text-center"
          style={{ color: colors.text }}
        >
          {data.nombre_completo || "Tu Nombre"}
        </h1>

        {/* Especialidad y Matrícula */}
        {data.especialidad && (
          <p
            className="text-sm mb-1 text-center"
            style={{ color: colors.text, opacity: 0.8 }}
          >
            {data.especialidad}
          </p>
        )}
        {data.matricula && (
          <p
            className="text-xs mb-4 text-center"
            style={{ color: colors.text, opacity: 0.6 }}
          >
            Mat. {data.matricula}
          </p>
        )}

        {/* Descripción */}
        {data.descripcion && (
          <p
            className="text-sm text-center mb-6 max-w-md"
            style={{ color: colors.text, opacity: 0.9 }}
          >
            {data.descripcion}
          </p>
        )}

        {/* Separador */}
        <div
          className="w-16 h-0.5 mx-auto mb-6"
          style={{ backgroundColor: colors.separator }}
        />

        {/* Botón de Turnos (ejemplo) */}
        <button
          className="w-full max-w-xs py-3 px-6 mb-4 rounded-full font-semibold transition-all border"
          style={{
            borderColor: colors.buttonBorder,
            color: colors.text,
            backgroundColor: "transparent",
          }}
        >
          Turnos
        </button>

        {/* Botones Dinámicos */}
        {buttons.length > 0 && (
          <div className="w-full max-w-xs space-y-3">
            {buttons.map((btn, index) => (
              <button
                key={index}
                className="w-full py-3 px-6 rounded-full font-semibold transition-all border"
                style={{
                  borderColor: colors.buttonBorder,
                  color: colors.text,
                  backgroundColor: "transparent",
                }}
              >
                {btn.texto || `Botón ${index + 1}`}
              </button>
            ))}
          </div>
        )}

        {/* Placeholder si no hay botones */}
        {buttons.length === 0 && (
          <p
            className="text-xs text-center mt-4 opacity-50"
            style={{ color: colors.text }}
          >
            Tus botones aparecerán aquí
          </p>
        )}
      </div>
    </div>
  );
}
