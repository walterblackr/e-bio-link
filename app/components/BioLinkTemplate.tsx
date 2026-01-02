"use client";

import { useEffect } from "react";

// Definimos la forma de los datos que esperamos recibir de la BD
interface BioLinkProps {
  data: {
    nombre_completo: string;
    foto_url: string;
    especialidad?: string;
    matricula?: string;
    mensaje?: string;
    cal_username: string;
    botones_config: any[];
    tema_config: any;
  };
}

export default function BioLinkTemplate({ data }: BioLinkProps) {
  // Extraemos valores con fallbacks por si vienen vacíos
  const theme = data.tema_config || {};
  const colors = {
    background: theme.background || "#f8fafc",
    text: theme.text || "#0e0d0dff",
    buttonBorder: theme.buttonBorder || "#ffffff",
    separator: theme.separator || "#6ba1f2",
  };

  const buttons = Array.isArray(data.botones_config) ? data.botones_config : [];

  // Construimos el link de Cal.com dinámicamente
  // Si en la BD es "dr-juan", el link será "dr-juan/30min"
  const calLink = data.cal_username ? `${data.cal_username}/30min` : "";

  useEffect(() => {
    if (!data.cal_username) return; // No cargar Cal si no hay usuario

    (function (C: any, A: any, L: any) {
      let p = function (a: any, ar: any) {
        a.q.push(ar);
      };
      let d = C.document;
      C.Cal =
        C.Cal ||
        function () {
          let cal = C.Cal;
          let ar: any = arguments;
          if (!cal.loaded) {
            cal.ns = {};
            cal.q = cal.q || [];
            d.head.appendChild(d.createElement("script")).src = A;
            cal.loaded = true;
          }
          if (ar[0] === L) {
            const api: any = function () {
              p(api, arguments);
            };
            const namespace = ar[1];
            api.q = api.q || [];
            if (typeof namespace === "string") {
              cal.ns[namespace] = cal.ns[namespace] || api;
              p(cal.ns[namespace], ar);
              p(cal, ["initNamespace", namespace]);
            } else p(cal, ar);
            return;
          }
          p(cal, ar);
        };
    })(window, "https://app.cal.com/embed/embed.js", "init");

    (window as any).Cal("init", "30min", { origin: "https://app.cal.com" });
    (window as any).Cal.ns["30min"]("ui", {
      hideEventTypeDetails: false,
      layout: "month_view",
    });
  }, [data.cal_username]);

  return (
    <main
      className="min-h-screen py-8 px-6 flex flex-col items-center justify-start overflow-y-auto relative overflow-x-hidden selection:bg-blue-100 font-sans"
      style={{ backgroundColor: colors.background }}
    >
      {/* --- FONDO DECORATIVO (Animado) --- */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-slate-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
      </div>

      {/* Contenedor principal centrado */}
      <div className="w-full max-w-xs text-center z-10 flex flex-col items-center my-auto animate-fade-in-up">
        {/* FOTO DE PERFIL */}
        <div className="relative w-28 h-28 mx-auto mb-4 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-white ring-1 ring-slate-100 transform hover:scale-105 transition-transform duration-300 overflow-hidden">
          {data.foto_url ? (
            <img
              src={data.foto_url}
              alt={data.nombre_completo}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl bg-slate-200">
              👨‍⚕️
            </div>
          )}
        </div>

        {/* NOMBRE */}
        <h1
          className="text-3xl font-extrabold uppercase leading-tight mb-2"
          style={{ color: colors.text }}
        >
          {data.nombre_completo}
        </h1>

        {/* ESPECIALIDAD Y MATRÍCULA */}
        {data.especialidad && (
          <p className="text-sm mb-1 opacity-90" style={{ color: colors.text }}>
            {data.especialidad}
          </p>
        )}
        {data.matricula && (
          <p className="text-xs mb-3 opacity-80" style={{ color: colors.text }}>
            {data.matricula}
          </p>
        )}

        {/* MENSAJE CORTO */}
        {data.mensaje && (
          <p
            className="text-xs mb-4 px-4 opacity-90 italic"
            style={{ color: colors.text }}
          >
            "{data.mensaje}"
          </p>
        )}

        {/* LÍNEA SEPARADORA */}
        <div
          className="w-16 h-0.5 mx-auto mb-6"
          style={{ backgroundColor: colors.separator }}
        ></div>

        {/* BOTÓN DE RESERVAR (CAL.COM) */}
        {data.cal_username && (
          <button
            data-cal-link={calLink}
            data-cal-namespace="30min"
            data-cal-config='{"layout":"month_view"}'
            className="flex items-center justify-center w-full max-w-xs py-3 px-6 mb-4 rounded-full font-semibold transition-all transform hover:scale-105 bg-transparent border lowercase tracking-wider font-[family-name:var(--font-space-mono)]"
            style={{
              borderColor: colors.buttonBorder,
              color: colors.text,
            }}
          >
            turnos
          </button>
        )}

        {/* LISTA DE BOTONES DINÁMICOS */}
        <div className="w-full space-y-4">
          {buttons.map((btn, index) => (
            <a
              key={index}
              href={btn.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full py-3 px-6 rounded-full font-semibold transition-all transform hover:scale-105 bg-transparent border lowercase tracking-wider font-[family-name:var(--font-space-mono)]"
              style={{
                borderColor: colors.buttonBorder,
                color: colors.text,
              }}
            >
              {btn.label || "Enlace"}
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
