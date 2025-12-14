"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";
import { doctorData } from "../../data/doctor";

export default function BookingPage() {
  const router = useRouter();

  useEffect(() => {
    (function (C, A, L) {
      let p = function (a, ar) { a.q.push(ar); };
      let d = C.document;
      C.Cal = C.Cal || function () {
        let cal = C.Cal;
        let ar = arguments;
        if (!cal.loaded) {
          cal.ns = {};
          cal.q = cal.q || [];
          d.head.appendChild(d.createElement("script")).src = A;
          cal.loaded = true;
        }
        if (ar[0] === L) {
          const api = function () { p(api, arguments); };
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

    window.Cal("init", "30min", { origin: "https://app.cal.com" });
    window.Cal.ns["30min"]("ui", { hideEventTypeDetails: false, layout: "month_view" });

    // Abrir el calendario automáticamente después de un pequeño delay
    setTimeout(() => {
      const calButton = document.querySelector('[data-cal-namespace="30min"]');
      if (calButton) {
        calButton.click();
      }
    }, 500);
  }, []);

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* HEADER SIMPLE CON BOTÓN VOLVER */}
      <div className="p-4 border-b border-gray-100 flex items-center gap-4 sticky top-0 bg-white z-10">
        <button 
          onClick={() => router.back()} 
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <FaArrowLeft className="text-gray-600" />
        </button>
        <h1 className="font-bold text-lg text-gray-800">Reservar Turno</h1>
      </div>

      {/* CALENDARIO PANTALLA COMPLETA */}
      <div className="flex-1 w-full h-full overflow-hidden flex items-center justify-center">
         <button
            data-cal-link="walter-rafael-garrido-t2aiac/30min"
            data-cal-namespace="30min"
            data-cal-config='{"layout":"month_view"}'
            className="hidden"
         />
         <p className="text-gray-500 text-sm">Cargando calendario...</p>
      </div>
    </main>
  );
}