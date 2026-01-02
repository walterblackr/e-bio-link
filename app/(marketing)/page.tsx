"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { FaCalendarAlt, FaWhatsapp } from "react-icons/fa";
import { FileText, Users, ArrowRight, Play } from "lucide-react";
import { doctorData } from "../../data/doctor";

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
      className="min-h-screen py-8 px-6 flex flex-col items-center justify-start overflow-y-auto relative overflow-x-hidden selection:bg-blue-100 font-sans"
      style={{ backgroundColor: '#f8fafc' }}
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
           <img
             src={doctorData.avatar}
             alt={doctorData.name}
             className="absolute inset-0 w-full h-full object-cover"
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
          {/* BOTÓN 1: PROPUESTA COMERCIAL */}
          <Link
            href="/propuesta"
            className="group relative flex items-center justify-between w-full py-4 px-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 hover:-translate-y-1 transition-all duration-300"
          >
             <div className="flex items-center gap-4">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FileText size={20} strokeWidth={2.5} />
                </div>
                <span className="font-bold text-slate-700 group-hover:text-blue-700">Propuesta Comercial</span>
             </div>
             <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
          </Link>

          {/* BOTÓN 2: QUIÉNES SOMOS */}
          <Link
            href="/quienes-somos"
            className="group relative flex items-center justify-between w-full py-4 px-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 hover:-translate-y-1 transition-all duration-300"
          >
             <div className="flex items-center gap-4">
                <div className="p-2.5 bg-slate-50 text-slate-600 rounded-xl group-hover:bg-slate-800 group-hover:text-white transition-colors">
                    <Users size={20} strokeWidth={2.5} />
                </div>
                <span className="font-bold text-slate-700 group-hover:text-slate-900">Quiénes Somos</span>
             </div>
             <ArrowRight size={18} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
          </Link>

          {/* SEPARADOR VISUAL */}
          <div className="flex items-center gap-4 w-full py-2 opacity-50">
            <div className="h-px bg-slate-300 flex-1"></div>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Acciones</span>
            <div className="h-px bg-slate-300 flex-1"></div>
          </div>

          {/* BOTÓN 3: VER DEMO */}
          <a
            href="https://e-bio-link-cr-v-bruce.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full py-4 px-6 rounded-2xl bg-slate-900 text-white shadow-xl shadow-slate-200 hover:bg-slate-800 hover:scale-[1.02] active:scale-95 transition-all duration-300 gap-3 group"
          >
             <div className="bg-white/10 p-1 rounded-full">
                <Play size={16} fill="currentColor" className="text-white ml-0.5" />
             </div>
             <span className="font-bold tracking-wide">VER DEMO EN VIVO</span>
          </a>

          {/* BOTÓN 4: WHATSAPP */}
          <a
            href="https://wa.me/5492994091255"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full py-4 px-6 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all duration-300 gap-3"
          >
             <FaWhatsapp size={22} />
             <span className="font-bold tracking-wide">ME INTERESA / HABLAR</span>
          </a>



          {/* BOTONES ORIGINALES DEL DOCTOR */}
          {/* */}
          {/*
          doctorData.links.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full py-4 px-6 rounded-2xl font-bold transition-all bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 hover:-translate-y-1 lowercase tracking-wider font-[family-name:var(--font-space-mono)]"
              style={{
                color: doctorData.colors.text
              }}
              onClick={() => {
                // Trackear evento Lead en Meta Pixel cuando se hace clic en WhatsApp
                if (link.label.toLowerCase() === 'whatsapp' && typeof window !== 'undefined' && (window as any).fbq) {
                  (window as any).fbq('track', 'Lead');
                }
              }}
            >
              {link.label}
            </a>
          ))
          /*}
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
