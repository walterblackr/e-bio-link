"use client";
import React from 'react';

export default function QuienesSomos() {
  return (
    <>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
          background-color: #f8fafc;
          color: #64748b;
          line-height: 1.6;
          min-height: 100vh;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* Hero Section */
        .hero {
          position: relative;
          padding: 80px 0 96px;
          text-align: center;
          overflow: hidden;
        }

        .hero-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 9999px;
          background-color: #f8fafc;
          border: 1px solid #dbeafe;
          color: #1d4ed8;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 24px;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }

        .hero h1 {
          font-size: 2.5rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 24px;
          line-height: 1.2;
        }

        .hero-highlight {
          color: #2563eb;
        }

        .hero p {
          font-size: 1.25rem;
          max-width: 672px;
          margin: 0 auto;
          color: #64748b;
          line-height: 1.75;
        }

        /* Historia Section */
        .historia {
          padding: 64px 0;
          background-color: white;
          border-top: 1px solid #f1f5f9;
          border-bottom: 1px solid #f1f5f9;
        }

        .historia-content {
          display: grid;
          grid-template-columns: 1fr;
          gap: 40px;
          align-items: center;
        }

        @media (min-width: 768px) {
          .hero h1 {
            font-size: 3rem;
          }

          .historia-content {
            grid-template-columns: 1fr 1fr;
            gap: 64px;
          }
        }

        .imagen-placeholder {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          background-color: #e2e8f0;
          aspect-ratio: 16 / 9;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .imagen-placeholder span {
          color: #94a3b8;
          font-size: 0.875rem;
        }

        .historia h2 {
          font-size: 1.875rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 24px;
        }

        .historia p {
          font-size: 1.125rem;
          line-height: 1.75;
          margin-bottom: 16px;
        }

        .historia strong {
          color: #0f172a;
        }

        .highlight-text {
          font-weight: 600;
          color: #3b82f6;
        }

        /* Equipo Section */
        .equipo {
          padding: 80px 0;
          background-color: #f8fafc;
        }

        .equipo-header {
          text-align: center;
          margin-bottom: 64px;
        }

        .equipo h2 {
          font-size: 1.875rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 16px;
        }

        .equipo-header p {
          color: #64748b;
          max-width: 672px;
          margin: 0 auto;
        }

        .equipo-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
          max-width: 896px;
          margin: 0 auto;
        }

        @media (min-width: 768px) {
          .equipo-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        .tarjeta-fundador {
          background-color: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #f1f5f9;
          position: relative;
          overflow: hidden;
          transition: box-shadow 0.3s ease;
        }

        .tarjeta-fundador:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }

        .tarjeta-borde {
          position: absolute;
          top: 0;
          left: 0;
          width: 8px;
          height: 100%;
          background-color: #2563eb;
        }

        .tarjeta-borde.teal {
          background-color: #14b8a6;
        }

        .fundador-header {
          display: flex;
          gap: 24px;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .fundador-foto {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background-color: #cbd5e1;
          flex-shrink: 0;
          overflow: hidden;
          border: 2px solid white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .fundador-foto span {
          color: #64748b;
          font-size: 0.75rem;
        }

        .fundador-info h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0f172a;
        }

        .fundador-cargo {
          font-weight: 500;
          font-size: 0.875rem;
          letter-spacing: 0.025em;
        }

        .fundador-cargo.blue {
          color: #2563eb;
        }

        .fundador-cargo.teal {
          color: #14b8a6;
        }

        .fundador-titulo {
          font-size: 0.75rem;
          color: #94a3b8;
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }

        .fundador-quote {
          color: #64748b;
          font-style: italic;
          line-height: 1.625;
        }

        .tags {
          margin-top: 24px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .tag {
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .tag.blue {
          background-color: #eff6ff;
          color: #1d4ed8;
        }

        .tag.teal {
          background-color: #f0fdfa;
          color: #0f766e;
        }

        /* Pilares Section */
        .pilares {
          padding: 80px 0;
          background-color: #0f172a;
          color: white;
        }

        .pilares-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 48px;
          text-align: center;
        }

        @media (min-width: 768px) {
          .pilares-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .pilar {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .pilar-icon {
          width: 64px;
          height: 64px;
          background-color: #1e293b;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
        }

        .pilar h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .pilar p {
          color: #94a3b8;
          line-height: 1.75;
          max-width: 288px;
        }

        /* CTA Section */
        .cta {
          padding: 96px 0;
          background-color: white;
          text-align: center;
        }

        .cta h2 {
          font-size: 1.875rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 24px;
        }

        @media (min-width: 768px) {
          .cta h2 {
            font-size: 2.25rem;
          }
        }

        .cta p {
          font-size: 1.125rem;
          color: #64748b;
          margin-bottom: 40px;
          max-width: 672px;
          margin-left: auto;
          margin-right: auto;
        }

        .cta-button {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background-color: #2563eb;
          color: white;
          font-weight: 700;
          padding: 16px 32px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transition: all 0.3s ease;
          font-size: 1rem;
        }

        .cta-button:hover {
          background-color: #1d4ed8;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          transform: translateY(-4px);
        }

        .cta-disclaimer {
          margin-top: 24px;
          font-size: 0.875rem;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .check-icon {
          color: #22c55e;
        }

        /* Icons SVG */
        svg {
          width: 32px;
          height: 32px;
        }
      `}</style>

      <div>
        {/* HERO SECTION */}
        <section className="hero">
          <div className="container">
            <span className="hero-badge">Sobre Nosotros</span>
            <h1>
              Tu socio tecnológico en la <br />
              <span className="hero-highlight">gestión médica inteligente</span>
            </h1>
            <p>
              La fusión entre ingeniería de sistemas y estrategia financiera diseñada para devolverle el tiempo y la rentabilidad a tu consultorio.
            </p>
          </div>
        </section>

        {/* NUESTRA HISTORIA */}
        <section className="historia">
          <div className="container">
            <div className="historia-content">
              <div className="imagen-placeholder">
                <img
                  src="/ebiolink.png"
                  alt="e-bio-link Platform"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                />
              </div>
              <div>
                <h2>Tu socio estratégico</h2>
                <p>
                  En un mundo donde todo se resuelve con un clic, la gestión de turnos médicos se había quedado en el pasado.
                  <strong> Nosotros venimos a cerrar esa brecha.</strong>
                </p>
                <p>
                  Somos la plataforma que digitaliza, rentabiliza y organiza consultorios médicos independientes. No somos solo una agenda digital; somos una herramienta financiera diseñada para blindar tus ingresos contra el ausentismo y recuperar tu tiempo libre.
                </p>
                <p>
                  Combinamos la potencia de <span className="highlight-text">Mercado Pago</span>, la inteligencia de <span className="highlight-text">Google Calendar</span> y la simplicidad de <span className="highlight-text">WhatsApp</span> para crear el ecosistema definitivo.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* EL EQUIPO */}
        <section className="equipo">
          <div className="container">
            <div className="equipo-header">
              <h2>Conoce a los Fundadores</h2>
              <p>
                No somos una corporación anónima. Somos expertos en nuestras áreas comprometidos personalmente con el éxito de tu consultorio.
              </p>
            </div>

            <div className="equipo-grid">
              {/* Tarjeta Walter */}
              <div className="tarjeta-fundador">
                <div className="tarjeta-borde"></div>
                <div className="fundador-header">
                  <div className="fundador-foto">

                    <img
                      src="/walter.jpeg"
                      alt="Walter Garrido"
                      width={200}
                      height={200}
                      className="object-cover"


                    />
                  </div>
                  <div className="fundador-info">
                    <h3>Lic. Walter Garrido</h3>
                    <div className="fundador-cargo blue">CO-FOUNDER & CTO</div>
                    <div className="fundador-titulo">Licenciado en Sistemas</div>
                  </div>
                </div>
                <p className="fundador-quote">
                  "Creo en la tecnología que simplifica sin interrumpir. Mi rol es asegurar que cada proceso, desde el cobro hasta la reserva, funcione de manera fluida y automática. Construyo soluciones digitales silenciosas que optimizan la gestión diaria de tu consultorio."
                </p>
                <div className="tags">
                  <span className="tag blue">Sincronizacion</span>
                  <span className="tag blue">Automatización</span>
                </div>
              </div>

              {/* Tarjeta Valeria */}
              <div className="tarjeta-fundador">
                <div className="tarjeta-borde teal"></div>
                <div className="fundador-header">
                  <div className="fundador-foto">
                    <img
                      src="/valeria.jpeg"
                      alt="Valeria"
                      width={80}
                      height={90}
                      className="object-cover"
                    />
                  </div>
                  <div className="fundador-info">
                    <h3>Cdora. Valeria</h3>
                    <div className="fundador-cargo teal">CO-FOUNDER & CFO</div>
                    <div className="fundador-titulo">Contador Público</div>
                  </div>
                </div>
                <p className="fundador-quote">
                  "Más que una agenda, gestionamos la salud financiera de tu práctica. Mi rol es transformar el tiempo administrativo en rentabilidad real. Diseñamos un sistema que previene el ausentismo y organiza tus ingresos, para que tu consultorio crezca con orden y previsibilidad."
                </p>
                <div className="tags">
                  <span className="tag teal">Rentabilidad</span>
                  <span className="tag teal">Gestión</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PILARES DE VALOR */}
        <section className="pilares">
          <div className="container">
            <div className="pilares-grid">
              {/* Pilar 1 */}
              <div className="pilar">
                <div className="pilar-icon">
                  <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: '#60a5fa' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <h3>Seguridad de Datos</h3>
                <p>
                  Como Licenciados en Sistemas, tratamos la privacidad de tus pacientes con estándares de seguridad bancarios.
                </p>
              </div>

              {/* Pilar 2 */}
              <div className="pilar">
                <div className="pilar-icon">
                  <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: '#5eead4' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                  </svg>
                </div>
                <h3>Enfoque en Rentabilidad</h3>
                <p>
                  Como Contadores, cada función está pensada para proteger tu dinero y maximizar tus ingresos mensuales.
                </p>
              </div>

              {/* Pilar 3 */}
              <div className="pilar">
                <div className="pilar-icon">
                  <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: '#c084fc' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </div>
                <h3>Trato Directo</h3>
                <p>
                  Sin bots ni call centers anónimos. Hablas directamente con los dueños y creadores de la plataforma.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="cta">
          <div className="container">
            <h2>¿Listo para profesionalizar tu consultorio?</h2>
            <p>
              Hablemos. Queremos entender tu caso particular y mostrarte cómo nuestra tecnología puede trabajar para ti.
            </p>
            <a
              href="https://wa.me/5492994091255"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-button"
            >
              Hablar con un Fundador
              <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <div className="cta-disclaimer">
              <svg className="check-icon" stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Sin compromiso de compra
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
