"use client";
import React from 'react';
import { Clock, ArrowRight, TrendingDown, AlertCircle, CreditCard, Calendar, CheckCircle, Star } from 'lucide-react';

export default function PropuestaComercial() {
  return (
    <>
      <style jsx global>{`
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .propuesta-container {
          background-color: #f8fafc;
          color: #64748b;
          min-height: 100vh;
        }

        .propuesta-container ::selection {
          background-color: #dbeafe;
        }

        /* Hero Section */
        .hero-section {
          position: relative;
          padding-top: 64px;
          padding-bottom: 80px;
          overflow: hidden;
        }

        .hero-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
          position: relative;
          z-index: 10;
          text-align: center;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 4px 12px;
          border-radius: 9999px;
          background-color: #eff6ff;
          border: 1px solid #dbeafe;
          color: #1d4ed8;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 24px;
        }

        .hero-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 24px;
          line-height: 1.2;
        }

        .hero-title-highlight {
          color: #2563eb;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          max-width: 672px;
          margin: 0 auto;
          line-height: 1.75;
          color: #64748b;
        }

        .hero-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 0;
          opacity: 0.4;
        }

        .hero-bg-blob {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 500px;
          background-color: #dbeafe;
          border-radius: 50%;
          mix-blend-mode: multiply;
          filter: blur(60px);
          opacity: 0.5;
        }

        /* Container */
        .content-container {
          max-width: 1152px;
          margin: 0 auto;
          padding: 0 16px;
          padding-bottom: 96px;
        }

        /* Sections */
        .section-card {
          background-color: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
          border: 1px solid #f1f5f9;
          position: relative;
          overflow: hidden;
          margin-bottom: 64px;
        }

        .section-border-blue {
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background-color: #3b82f6;
        }

        .section-border-red {
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background-color: #ef4444;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .icon-box {
          padding: 8px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-box-blue {
          background-color: #dbeafe;
          color: #2563eb;
        }

        .icon-box-red {
          background-color: #fee2e2;
          color: #dc2626;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .section-subtitle {
          font-size: 1.125rem;
          font-weight: 500;
          color: #64748b;
          margin-bottom: 24px;
          font-style: italic;
        }

        .section-text {
          color: #475569;
          line-height: 1.75;
          margin-bottom: 24px;
        }

        /* Time Math */
        .time-math {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 16px;
          background-color: #f8fafc;
          padding: 16px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          font-size: 1rem;
          font-weight: 500;
          color: #334155;
        }

        .time-math-result {
          background-color: #dbeafe;
          color: #1e40af;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid #bfdbfe;
        }

        /* Solution Box */
        .solution-box {
          background-color: #eff6ff;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          border: 1px solid #dbeafe;
          margin-top: 32px;
        }

        .solution-title {
          color: #1e3a8a;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .solution-text {
          color: #475569;
          font-size: 0.875rem;
        }

        .solution-number {
          font-size: 2.25rem;
          font-weight: 800;
          color: #2563eb;
          margin: 8px 0;
        }

        /* Impact Calc */
        .impact-calc {
          background-color: rgba(254, 242, 242, 0.5);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #fecaca;
        }

        .impact-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 0.875rem;
        }

        .impact-row-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .impact-label {
          color: #475569;
        }

        .impact-label-strong {
          font-weight: 600;
          color: #7f1d1d;
        }

        .impact-value-striked {
          text-decoration: line-through;
          color: #94a3b8;
        }

        .impact-value-red {
          font-size: 1.25rem;
          font-weight: 700;
          color: #dc2626;
        }

        .impact-divider {
          height: 1px;
          background-color: #fecaca;
          margin: 8px 0;
        }

        .impact-total-label {
          font-weight: 700;
          color: #0f172a;
        }

        .impact-total-value {
          font-size: 1.5rem;
          font-weight: 900;
          color: #0f172a;
        }

        .analysis-box {
          background-color: #f8fafc;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .analysis-header {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }

        .analysis-title {
          font-size: 0.875rem;
          color: #334155;
          font-weight: 500;
        }

        .analysis-text {
          font-size: 0.875rem;
          color: #475569;
          line-height: 1.75;
        }

        /* Plans */
        .plans-section {
          margin-bottom: 64px;
        }

        .plans-title {
          font-size: 1.875rem;
          font-weight: 700;
          color: #0f172a;
          text-align: center;
          margin-bottom: 40px;
        }

        .plans-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }

        @media (min-width: 768px) {
          .hero-title {
            font-size: 3rem;
          }

          .hero-subtitle {
            font-size: 1.25rem;
          }

          .section-card {
            padding: 48px;
          }

          .plans-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .time-math {
            font-size: 1rem;
          }
        }

        .plan-card {
          background-color: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          border: 1px solid #e2e8f0;
          position: relative;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
        }

        .plan-card:hover {
          border: 2px solid #3b82f6;
          transform: translateY(-16px);
          box-shadow: 0 20px 25px -5px rgba(59, 130, 246, 0.3), 0 10px 10px -5px rgba(59, 130, 246, 0.1);
        }

        .plan-card-recommended {
          border: 2px solid #3b82f6;
          transform: translateY(-16px);
        }

        /* Cuando hay hover en cualquier card, el recomendado vuelve a su estado normal */
        .plans-grid:has(.plan-card:hover) .plan-card-recommended:not(:hover) {
          border: 1px solid #e2e8f0;
          transform: translateY(0);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }

        .plan-badge {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translate(-50%, -50%);
          background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
          color: white;
          padding: 4px 16px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .plan-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 8px;
        }

        .plan-description {
          font-size: 0.875rem;
          color: #64748b;
          margin-bottom: 24px;
        }

        .plan-price-container {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 24px;
        }

        .plan-price {
          font-size: 2.25rem;
          font-weight: 800;
          color: #2563eb;
        }

        .plan-price-normal {
          font-size: 2.25rem;
          font-weight: 700;
          color: #1e293b;
        }

        .plan-price-label {
          color: #94a3b8;
          font-weight: 500;
        }

        .plan-details {
          background-color: rgba(239, 246, 255, 0.5);
          padding: 16px;
          border-radius: 12px;
          border: 1px solid #dbeafe;
          margin-bottom: 32px;
        }

        .plan-details-normal {
          padding: 16px;
          margin-bottom: 32px;
        }

        .plan-detail-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e2e8f0;
        }

        .plan-detail-row:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
          border-bottom: none;
        }

        .plan-detail-label {
          color: #475569;
        }

        .plan-detail-value {
          font-weight: 700;
          color: #1d4ed8;
        }

        .plan-detail-value-normal {
          font-weight: 500;
          color: #334155;
        }

        .plan-detail-value-strong {
          font-weight: 700;
          color: #0f172a;
        }

        .plan-button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 16px;
          border-radius: 12px;
          font-weight: 700;
          text-align: center;
          transition: all 0.3s ease;
          text-decoration: none;
        }

        .plan-button-primary {
          background-color: #2563eb;
          color: white;
          box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
          text-align: center !important;
        }

        .plan-button-primary:hover {
          background-color: #1d4ed8;
        }

        .plan-button-secondary {
          background-color: white;
          color: #475569;
          border: 2px solid #e2e8f0;
          text-align: center !important;
        }

        .plan-button-secondary:hover {
          border-color: #3b82f6;
          color: #2563eb;
        }

        /* Features */
        .features-section {
          background-color: #0f172a;
          border-radius: 24px;
          padding: 32px;
          color: white;
          text-align: center;
          position: relative;
          overflow: hidden;
          margin-bottom: 64px;
        }

        @media (min-width: 768px) {
          .features-section {
            padding: 64px;
          }
        }

        .features-bg {
          position: absolute;
          top: 0;
          right: 0;
          width: 256px;
          height: 256px;
          background-color: #3b82f6;
          border-radius: 50%;
          mix-blend-mode: overlay;
          filter: blur(60px);
          opacity: 0.2;
        }

        .features-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 48px;
          position: relative;
        }

        @media (min-width: 768px) {
          .features-title {
            font-size: 1.875rem;
          }
        }

        .features-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
          position: relative;
        }

        @media (min-width: 768px) {
          .features-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .feature-item {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          background-color: #1e293b;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .feature-icon-blue {
          color: #60a5fa;
        }

        .feature-icon-purple {
          color: #c084fc;
        }

        .feature-icon-green {
          color: #4ade80;
        }

        .feature-icon-orange {
          color: #fb923c;
        }

        .feature-title {
          font-weight: 700;
          margin-bottom: 8px;
        }

        .feature-description {
          font-size: 0.875rem;
          color: #94a3b8;
        }

        /* Footer */
        .footer {
          background-color: white;
          border-top: 1px solid #e2e8f0;
          padding: 40px 0;
          text-align: center;
          color: #94a3b8;
          font-size: 0.875rem;
        }

        .section-flex {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        @media (min-width: 768px) {
          .section-flex {
            flex-direction: row;
            align-items: stretch;
          }

          .section-flex-2-3 {
            flex: 0 0 66.666667%;
          }

          .section-flex-1-3 {
            flex: 0 0 33.333333%;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
          }
        }
      `}</style>

      <div className="propuesta-container">
        {/* HERO SECTION */}
        <header className="hero-section">
          <div className="hero-content">
            <div className="hero-badge">
              <Star size={16} /> Propuesta Comercial
            </div>
            <h1 className="hero-title">
              Gestión de Turnos <br className="hidden md:block" />
              <span className="hero-title-highlight">& Cobros Automatizados</span>
            </h1>
            <p className="hero-subtitle">
              La solución tecnológica para blindar tu agenda contra el ausentismo y recuperar tu tiempo libre.
            </p>
          </div>

          {/* Fondo Decorativo */}
          <div className="hero-bg">
            <div className="hero-bg-blob"></div>
          </div>
        </header>

        <div className="content-container">

          {/* SECCIÓN 1: TIEMPO */}
          <section className="section-card">
            <div className="section-border-blue"></div>
            <div className="section-flex">
              <div className="section-flex-2-3">
                <div className="section-header">
                  <div className="icon-box icon-box-blue">
                    <Clock size={24} />
                  </div>
                  <h2 className="section-title">Nuestro Objetivo: Devolverte tiempo de tu Vida</h2>
                </div>
                <h3 className="section-subtitle">"De 16 horas mensuales a 0 minutos."</h3>
                <p className="section-text">
                  Gestionar turnos por WhatsApp te toma 10 minutos por paciente. Si atiendes un volumen estándar, la matemática es cruel:
                </p>

                <div className="time-math">
                  <span>10 min/paciente</span>
                  <ArrowRight size={16} color="#94a3b8" />
                  <span>4 horas/semana</span>
                  <ArrowRight size={16} color="#94a3b8" />
                  <span className="time-math-result">16 HORAS AL MES</span>
                </div>
              </div>

              <div className="section-flex-1-3">
                <div className="solution-box">
                  <p className="solution-title">La Solución</p>
                  <p className="solution-text">Nuestro sistema reduce ese tiempo a</p>
                  <div className="solution-number">0 min</div>
                  <p className="solution-text">Tu agenda se llena sola.</p>
                </div>
              </div>
            </div>
          </section>

          {/* SECCIÓN 2: DINERO */}
          <section className="section-card">
            <div className="section-border-red"></div>
            <div className="section-flex">
              <div className="section-flex-2-3">
                <div className="section-header">
                  <div className="icon-box icon-box-red">
                    <TrendingDown size={24} />
                  </div>
                  <h2 className="section-title">El Costo Real del Ausentismo</h2>
                </div>
                <p className="section-text">
                  Modelo tradicional sin seña • Tasa de ausentismo promedio: <strong>30%</strong>
                </p>

                <div className="impact-calc">
                  <div className="impact-row">
                    <span className="impact-label">Proyección (20 pacientes x $40.000)</span>
                    <span className="impact-value-striked">$800.000</span>
                  </div>
                  <div className="impact-row-main">
                    <span className="impact-label-strong">Dinero Perdido (Mes)</span>
                    <span className="impact-value-red">-$240.000</span>
                  </div>
                  <div className="impact-divider"></div>
                  <div className="impact-row-main">
                    <span className="impact-total-label">PÉRDIDA ANUAL</span>
                    <span className="impact-total-value">-$2.880.000</span>
                  </div>
                </div>
              </div>

              <div className="section-flex-1-3">
                <div className="analysis-box">
                  <div className="analysis-header">
                    <AlertCircle size={20} color="#2563eb" />
                    <p className="analysis-title">Análisis de Inversión</p>
                  </div>
                  <p className="analysis-text">
                    Inviertes <strong>$150.000</strong> para dejar de perder casi <strong>3 Millones</strong>. Con evitar solo 4 ausencias en todo el año, el sistema es gratis.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* PLANES */}
          <section className="plans-section">
            <h2 className="plans-title">Planes de Inversión</h2>
            <div className="plans-grid">

              {/* PLAN ANUAL */}
              <div className="plan-card plan-card-recommended">
                <div className="plan-badge">Recomendado</div>
                <h3 className="plan-title">Plan Anual</h3>
                <p className="plan-description">Congela el precio hoy por 12 meses.</p>
                <div className="plan-price-container">
                  <span className="plan-price">$150.000</span>
                  <span className="plan-price-label">/ único</span>
                </div>

                <div className="plan-details">
                  <div className="plan-detail-row">
                    <span className="plan-detail-label">Costo mensual real:</span>
                    <span className="plan-detail-value">$12.500</span>
                  </div>
                  <div className="plan-detail-row">
                    <span className="plan-detail-label">Equivalencia:</span>
                    <span className="plan-detail-value-strong">4 consultas</span>
                  </div>
                </div>

                <a
                  href="https://wa.me/5492994091255?text=Hola!%20Me%20interesa%20el%20Plan%20Anual%20(%24150.000)%20de%20Gestión%20de%20Turnos.%20Me%20gustaría%20recibir%20más%20información."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="plan-button plan-button-primary"
                >
                  Elegir Anual
                </a>
              </div>

              {/* PLAN SEMESTRAL */}
              <div className="plan-card">
                <h3 className="plan-title">Plan Semestral</h3>
                <p className="plan-description">Ideal para probar a mediano plazo.</p>
                <div className="plan-price-container">
                  <span className="plan-price-normal">$90.000</span>
                  <span className="plan-price-label">/ único</span>
                </div>

                <div className="plan-details-normal">
                  <div className="plan-detail-row">
                    <span className="plan-detail-label">Costo mensual:</span>
                    <span className="plan-detail-value-normal">$15.000</span>
                  </div>
                  <div className="plan-detail-row">
                    <span className="plan-detail-label">Equivalencia:</span>
                    <span className="plan-detail-value-normal">2.5 consultas</span>
                  </div>
                </div>

                <a
                  href="https://wa.me/5492994091255?text=Hola!%20Me%20interesa%20el%20Plan%20Semestral%20(%2490.000)%20de%20Gestión%20de%20Turnos.%20Me%20gustaría%20recibir%20más%20información."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="plan-button plan-button-secondary"
                >
                  Elegir Semestral
                </a>
              </div>

              {/* PLAN TRIMESTRAL */}
              <div className="plan-card">
                <h3 className="plan-title">Plan Trimestral</h3>
                <p className="plan-description">Menor inversión inicial.</p>
                <div className="plan-price-container">
                  <span className="plan-price-normal">$50.000</span>
                  <span className="plan-price-label">/ único</span>
                </div>

                <div className="plan-details-normal">
                  <div className="plan-detail-row">
                    <span className="plan-detail-label">Costo mensual:</span>
                    <span className="plan-detail-value-normal">$16.600</span>
                  </div>
                  <div className="plan-detail-row">
                    <span className="plan-detail-label">Equivalencia:</span>
                    <span className="plan-detail-value-normal">1.2 consultas</span>
                  </div>
                </div>

                <a
                  href="https://wa.me/5492994091255?text=Hola!%20Me%20interesa%20el%20Plan%20Trimestral%20(%2450.000)%20de%20Gestión%20de%20Turnos.%20Me%20gustaría%20recibir%20más%20información."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="plan-button plan-button-secondary"
                >
                  Elegir Trimestral
                </a>
              </div>

            </div>
          </section>

          {/* FEATURES */}
          <section className="features-section">
            <div className="features-bg"></div>

            <h2 className="features-title">✓ Todos los planes incluyen</h2>

            <div className="features-grid">
              <div className="feature-item">
                <div className="feature-icon feature-icon-blue">
                  <CreditCard size={24} />
                </div>
                <h3 className="feature-title">Cobro Anticipado</h3>
                <p className="feature-description">Integración total Mercado Pago</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon feature-icon-purple">
                  <Calendar size={24} />
                </div>
                <h3 className="feature-title">Sincronización</h3>
                <p className="feature-description">Google Calendar & Outlook</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon feature-icon-green">
                  <CheckCircle size={24} />
                </div>
                <h3 className="feature-title">Biolink Propio</h3>
                <p className="feature-description">Web personalizada con tu marca</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon feature-icon-orange">
                  <Star size={24} />
                </div>
                <h3 className="feature-title">Soporte Técnico</h3>
                <p className="feature-description">Atención directa con desarrolladores</p>
              </div>
            </div>
          </section>

        </div>

        <footer className="footer">
          <p>© 2025 - Gestión Profesional de Turnos Médicos</p>
        </footer>
      </div>
    </>
  );
}
