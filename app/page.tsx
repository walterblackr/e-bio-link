"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { FaCalendarAlt } from "react-icons/fa";
import { doctorData } from "../data/doctor";

export default function Home() {
  useEffect(() => {
    (function (C: any, A: any, L: any) {
      let p = function (a: any, ar: any) { a.q.push(ar); };
      let d = C.document;
      C.Cal = C.Cal || function () {
        let cal = C.Cal;
        let ar: any = arguments;
        if (!cal.loaded) {
          cal.ns = {};
          cal.q = cal.q || [];
          d.head.appendChild(d.createElement("script")).src = A;
          cal.loaded = true;
        }
        if (ar[0] === L) {
          const api: any = function () { p(api, arguments); };
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
    (window as any).Cal.ns["30min"]("ui", { hideEventTypeDetails: false, layout: "month_view" });
  }, []);

  return (
    <main
      className="min-h-screen py-8 px-6 flex flex-col items-center justify-start overflow-y-auto"
      style={{ backgroundColor: doctorData.colors.background }}
    >

      {/* Contenedor principal centrado */}
      <div className="w-full max-w-xs text-center z-10 flex flex-col items-center my-auto">
        
        {/* FOTO DE PERFIL */}
        <div className="relative w-28 h-28 mx-auto mb-4">
           <img
             src={doctorData.avatar}
             alt={doctorData.name}
             className="w-full h-full rounded-full object-cover shadow-md"
           />
        </div>

        {/* NOMBRE */}
        <h1
          className="text-3xl font-extrabold uppercase leading-tight mb-2"
          style={{ color: doctorData.colors.text }}
        >
          {doctorData.name}
        </h1>

        {/* ESPECIALIDAD Y MATRÍCULA */}
        <p
          className="text-sm mb-1 opacity-90"
          style={{ color: doctorData.colors.text }}
        >
          {doctorData.specialty}
        </p>
        <p
          className="text-xs mb-3 opacity-80"
          style={{ color: doctorData.colors.text }}
        >
          {doctorData.license}
        </p>

        {/* MENSAJE CORTO */}
        {doctorData.message && (
          <p
            className="text-xs mb-4 px-4 opacity-90 italic"
            style={{ color: doctorData.colors.text }}
          >
            "{doctorData.message}"
          </p>
        )}

        {/* LÍNEA SEPARADORA */}
        <div
          className="w-16 h-0.5 mx-auto mb-6"
          style={{ backgroundColor: doctorData.colors.separator }}
        ></div>

        {/* BOTÓN DE RESERVAR */}
        {/* <button
          data-cal-link="walter-rafael-garrido-t2aiac/30min"
          data-cal-namespace="30min"
          data-cal-config='{"layout":"month_view"}'
          className="flex items-center justify-center w-full max-w-xs py-3 px-6 mb-4 rounded-full font-semibold transition-all transform hover:scale-105 bg-transparent border lowercase tracking-wider font-[family-name:var(--font-space-mono)]"
          style={{
            borderColor: doctorData.colors.buttonBorder,
            color: doctorData.colors.text
          }}
        >
          turnos
        </button> */}

        {/* LISTA DE BOTONES (LINKS) */}
        <div className="w-full space-y-4">
          {doctorData.links.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full py-3 px-6 rounded-full font-semibold transition-all transform hover:scale-105 bg-transparent border lowercase tracking-wider font-[family-name:var(--font-space-mono)]"
              // Aplicamos colores dinámicos para borde y texto
              style={{ 
                borderColor: doctorData.colors.buttonBorder,
                color: doctorData.colors.text
              }}
            >
              {/* Puedes quitar el icono si quieres que sea solo texto como en la imagen */}
              {/* <span className="mr-3">{link.icon}</span> */}
              {link.label}
            </a>
          ))}
           {/* BOTÓN EXTRA PARA CONTACTO */}
          {/* <a
              href="mailto:contacto@olivia.com"
              className="flex items-center justify-center w-full py-3 px-6 rounded-full font-semibold transition-all transform hover:scale-105 bg-transparent border lowercase tracking-wider font-[family-name:var(--font-space-mono)]"
              style={{
                borderColor: doctorData.colors.buttonBorder,
                color: doctorData.colors.text
              }}
            >
              contacto
            </a> */}
        </div>

        {/* OBRAS SOCIALES */}
        {/* {doctorData.insurances && doctorData.insurances.length > 0 && (
          <div className="mt-6 pt-5 w-full">
            <div
              className="w-12 h-0.5 mx-auto mb-4"
              style={{ backgroundColor: doctorData.colors.separator }}
            ></div>
            <p
              className="text-xs uppercase tracking-wider mb-2 opacity-75"
              style={{ color: doctorData.colors.text }}
            >
              Obras Sociales
            </p>
            <p
              className="text-sm opacity-90 font-[family-name:var(--font-space-mono)]"
              style={{ color: doctorData.colors.text }}
            >
              {doctorData.insurances.join(" • ")}
            </p>
          </div>
        )} */}
      </div>

      {/* Footer (Opcional, lo oculto para que sea idéntico a la imagen) */}
      {/* <footer className="absolute bottom-5 text-white text-xs opacity-60">
        <p>© 2024</p>
      </footer>
      */}

    </main>
  );
}