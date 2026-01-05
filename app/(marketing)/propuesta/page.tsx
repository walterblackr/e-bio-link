"use client";
import React from 'react';
import { Clock, ArrowRight, TrendingDown, AlertCircle, CreditCard, Calendar, CheckCircle, Star } from 'lucide-react';
import styles from './propuesta.module.css';

export default function PropuestaComercial() {
  return (
    <div className={styles.propuestaContainer}>
        {/* HERO SECTION */}
        <header className={styles.heroSection}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <Star size={16} /> Propuesta Comercial
            </div>
            <h1 className={styles.heroTitle}>
              Gestión de Turnos <br className="hidden md:block" />
              <span className={styles.heroTitleHighlight}>& Cobros Automatizados</span>
            </h1>
            <p className={styles.heroSubtitle}>
              La solución tecnológica para blindar tu agenda contra el ausentismo y recuperar tu tiempo libre.
            </p>
          </div>

          {/* Fondo Decorativo */}
          <div className={styles.heroBg}>
            <div className={styles.heroBgBlob}></div>
          </div>
        </header>

        <div className={styles.contentContainer}>

          {/* SECCIÓN 1: TIEMPO */}
          <section className={styles.sectionCard}>
            <div className={styles.sectionBorderBlue}></div>
            <div className={styles.sectionFlex}>
              <div className={styles.sectionFlex23}>
                <div className={styles.sectionHeader}>
                  <div className={`${styles.iconBox} ${styles.iconBoxBlue}`}>
                    <Clock size={24} />
                  </div>
                  <h2 className={styles.sectionTitle}>Nuestro Objetivo: Devolverte tiempo de tu Vida</h2>
                </div>
                <h3 className={styles.sectionSubtitle}>"De 16 horas mensuales a 0 minutos."</h3>
                <p className={styles.sectionText}>
                  Gestionar turnos por WhatsApp te toma 10 minutos por paciente. Si atiendes un volumen estándar, la matemática es cruel:
                </p>

                <div className={styles.timeMath}>
                  <span>10 min/paciente</span>
                  <ArrowRight size={16} color="#94a3b8" />
                  <span>4 horas/semana</span>
                  <ArrowRight size={16} color="#94a3b8" />
                  <span className={styles.timeMathResult}>16 HORAS AL MES</span>
                </div>
              </div>

              <div className={styles.sectionFlex13}>
                <div className={styles.solutionBox}>
                  <p className={styles.solutionTitle}>La Solución</p>
                  <p className={styles.solutionText}>Nuestro sistema reduce ese tiempo a</p>
                  <div className={styles.solutionNumber}>0 min</div>
                  <p className={styles.solutionText}>Tu agenda se llena sola.</p>
                </div>
              </div>
            </div>
          </section>

          {/* SECCIÓN 2: DINERO */}
          <section className={styles.sectionCard}>
            <div className={styles.sectionBorderRed}></div>
            <div className={styles.sectionFlex}>
              <div className={styles.sectionFlex23}>
                <div className={styles.sectionHeader}>
                  <div className={`${styles.iconBox} ${styles.iconBoxRed}`}>
                    <TrendingDown size={24} />
                  </div>
                  <h2 className={styles.sectionTitle}>El Costo Real del Ausentismo</h2>
                </div>
                <p className={styles.sectionText}>
                  Modelo tradicional sin seña • Tasa de ausentismo promedio: <strong>30%</strong>
                </p>

                <div className={styles.impactCalc}>
                  <div className={styles.impactRow}>
                    <span className={styles.impactLabel}>Proyección (20 pacientes x $40.000)</span>
                    <span className={styles.impactValueStriked}>$800.000</span>
                  </div>
                  <div className={styles.impactRowMain}>
                    <span className={styles.impactLabelStrong}>Dinero Perdido (Mes)</span>
                    <span className={styles.impactValueRed}>-$240.000</span>
                  </div>
                  <div className={styles.impactDivider}></div>
                  <div className={styles.impactRowMain}>
                    <span className={styles.impactTotalLabel}>PÉRDIDA ANUAL</span>
                    <span className={styles.impactTotalValue}>-$2.880.000</span>
                  </div>
                </div>
              </div>

              <div className={styles.sectionFlex13}>
                <div className={styles.analysisBox}>
                  <div className={styles.analysisHeader}>
                    <AlertCircle size={20} color="#2563eb" />
                    <p className={styles.analysisTitle}>Análisis de Inversión</p>
                  </div>
                  <p className={styles.analysisText}>
                    Inviertes <strong>$120.000</strong> para dejar de perder casi <strong>3 Millones</strong>. Con evitar solo 4 ausencias en todo el año, el sistema es gratis.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* PLANES */}
          <section className={styles.plansSection}>
            <h2 className={styles.plansTitle}>Planes de Inversión</h2>
            <div className={styles.plansGrid}>

              {/* PLAN MENSUAL */}
              <div className={styles.planCard}>
                <div className={styles.planBadge}>PRUÉBALO</div>
                <h3 className={styles.planTitle}>Plan Mensual</h3>
                <p className={styles.planDescription}>Menor inversión inicial.</p>
                <div className={styles.planPriceContainer}>
                  <span className={styles.planPriceNormal}>$15.000</span>
                  <span className={styles.planPriceLabel}>/ mes</span>
                </div>

                <div className={styles.planDetailsNormal}>
                  <div className={styles.planDetailRow}>
                    <span className={styles.planDetailLabel}>Costo mensual:</span>
                    <span className={styles.planDetailValueNormal}>$15.000</span>
                  </div>
                  <div className={styles.planDetailRow}>
                    <span className={styles.planDetailLabel}>Equivalencia:</span>
                    <span className={styles.planDetailValueNormal}>1/2 consulta</span>
                  </div>
                </div>

                <a
                  href="https://wa.me/5492994091255?text=Hola,%20vi%20el%20Plan%20Mensual%20de%20$15.000%20en%20la%20web%20y%20quiero%20probarlo."
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.planButton} ${styles.planButtonSecondary}`}
                >
                  Elegir Mensual
                </a>
              </div>

              {/* PLAN ANUAL */}
              <div className={`${styles.planCard} ${styles.planCardRecommended}`}>
                <div className={styles.planBadge}>Recomendado</div>
                <h3 className={styles.planTitle}>Plan Anual</h3>
                <p className={styles.planDescription}>Congela el precio hoy por 12 meses.</p>
                <div className={styles.planPriceContainer}>
                  <span className={styles.planPrice}>$120.000</span>
                  <span className={styles.planPriceLabel}>/ único</span>
                </div>

                <div className={styles.planDetails}>
                  <div className={styles.planDetailRow}>
                    <span className={styles.planDetailLabel}>Costo mensual real:</span>
                    <span className={styles.planDetailValue}>$10.000</span>
                  </div>
                  <div className={styles.planDetailRow}>
                    <span className={styles.planDetailLabel}>Equivalencia:</span>
                    <span className={styles.planDetailValueStrong}>3 consultas</span>
                  </div>
                </div>

                <a
                  href="https://wa.me/5492994091255?text=Hola!%20Me%20interesa%20el%20Plan%20Anual%20(%24120.000)%20de%20Gestión%20de%20Turnos.%20Me%20gustaría%20recibir%20más%20información."
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.planButton} ${styles.planButtonPrimary}`}
                >
                  Elegir Anual
                </a>
              </div>

              {/* PLAN SEMESTRAL */}
              <div className={styles.planCard}>
                <h3 className={styles.planTitle}>Plan Semestral</h3>
                <p className={styles.planDescription}>Ideal para probar a mediano plazo.</p>
                <div className={styles.planPriceContainer}>
                  <span className={styles.planPriceNormal}>$80.000</span>
                  <span className={styles.planPriceLabel}>/ único</span>
                </div>

                <div className={styles.planDetailsNormal}>
                  <div className={styles.planDetailRow}>
                    <span className={styles.planDetailLabel}>Costo mensual:</span>
                    <span className={styles.planDetailValueNormal}>$13.333</span>
                  </div>
                  <div className={styles.planDetailRow}>
                    <span className={styles.planDetailLabel}>Equivalencia:</span>
                    <span className={styles.planDetailValueNormal}>2.2 consultas</span>
                  </div>
                </div>

                <a
                  href="https://wa.me/5492994091255?text=Hola!%20Me%20interesa%20el%20Plan%20Semestral%20(%2480.000)%20de%20Gestión%20de%20Turnos.%20Me%20gustaría%20recibir%20más%20información."
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.planButton} ${styles.planButtonSecondary}`}
                >
                  Elegir Semestral
                </a>
              </div>

            </div>
          </section>

          {/* FEATURES */}
          <section className={styles.featuresSection}>
            <div className={styles.featuresBg}></div>

            <h2 className={styles.featuresTitle}>✓ Todos los planes incluyen</h2>

            <div className={styles.featuresGrid}>
              <div className={styles.featureItem}>
                <div className="feature-icon feature-icon-blue">
                  <CreditCard size={24} />
                </div>
                <h3 className={styles.featureTitle}>Cobro Anticipado</h3>
                <p className={styles.featureDescription}>Integración total Mercado Pago</p>
              </div>
              <div className={styles.featureItem}>
                <div className="feature-icon feature-icon-purple">
                  <Calendar size={24} />
                </div>
                <h3 className={styles.featureTitle}>Sincronización</h3>
                <p className={styles.featureDescription}>Google Calendar & Outlook</p>
              </div>
              <div className={styles.featureItem}>
                <div className="feature-icon feature-icon-green">
                  <CheckCircle size={24} />
                </div>
                <h3 className={styles.featureTitle}>Biolink Propio</h3>
                <p className={styles.featureDescription}>Web personalizada con tu marca</p>
              </div>
              <div className={styles.featureItem}>
                <div className="feature-icon feature-icon-orange">
                  <Star size={24} />
                </div>
                <h3 className={styles.featureTitle}>Configuración Inicial</h3>
                <p className={styles.featureDescription}>Setup completo de tu perfil</p>
              </div>
            </div>
          </section>

        </div>

        <footer className={styles.footer}>
          <p>© 2025 - Gestión Profesional de Turnos Médicos</p>
        </footer>
      </div>
  );
}
