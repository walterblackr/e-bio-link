"use client";
import { doctorData } from "../../data/doctor";

export default function EnConstruccion() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: doctorData.colors.background }}
    >
      <div className="text-center max-w-md">
        <h1
          className="text-4xl font-extrabold uppercase mb-4"
          style={{ color: doctorData.colors.text }}
        >
          En Construcción
        </h1>

        <div
          className="w-16 h-0.5 mx-auto mb-6"
          style={{ backgroundColor: doctorData.colors.separator }}
        ></div>

        <p
          className="text-lg mb-8 opacity-90"
          style={{ color: doctorData.colors.text }}
        >
          Estamos trabajando en esta sección para brindarte la mejor experiencia.
        </p>

        <a
          href="/"
          className="inline-block py-3 px-8 rounded-full font-semibold transition-all transform hover:scale-105 bg-transparent border lowercase tracking-wider font-[family-name:var(--font-space-mono)]"
          style={{
            borderColor: doctorData.colors.buttonBorder,
            color: doctorData.colors.text
          }}
        >
          volver al inicio
        </a>
      </div>
    </main>
  );
}
