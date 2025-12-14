// src/app/layout.js
import { Inter, Space_Mono } from "next/font/google"; // Importamos la nueva fuente
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// Configuramos la fuente monoespaciada
const spaceMono = Space_Mono({ 
  weight: ['400', '700'], // Importamos pesos normal y negrita
  subsets: ["latin"],
  variable: '--font-space-mono' // Creamos una variable CSS
});

export const metadata = {
  title: "Bio Link",
  description: "Mi perfil profesional",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      {/* Agregamos la variable de la fuente al body */}
      <body className={`${inter.className} ${spaceMono.variable}`}>
        {children}
      </body>
    </html>
  );
}