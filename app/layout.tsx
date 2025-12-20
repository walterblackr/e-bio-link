// src/app/layout.js
import { Inter, Space_Mono } from "next/font/google"; // Importamos la nueva fuente
import Script from "next/script";
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
        {/* Meta Pixel Code */}
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');

            fbq('init', '1188929299399483');
            fbq('track', 'PageView');
          `}
        </Script>

        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1188929299399483&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>

        {children}
      </body>
    </html>
  );
}