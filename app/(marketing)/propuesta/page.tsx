"use client";
import Link from 'next/link';
import { Clock, ArrowRight, TrendingDown, AlertCircle, CreditCard, Calendar, CheckCircle, Star, Banknote } from 'lucide-react';
import styles from './propuesta.module.css';

function PlanFeatures({ highlighted = false }: { highlighted?: boolean }) {
  const check = highlighted ? '#1d4ed8' : '#16a34a';
  const features = [
    { icon: null, text: 'Biolink personalizado (ebiolink.com/tu-nombre)' },
    { icon: null, text: 'Agenda online — pacientes reservan solos, 24/7' },
    { icon: null, text: 'Sincronización con Google Calendar' },
    { icon: null, text: 'Videollamadas vía Google Meet (consultas virtuales)' },
    { icon: null, text: 'Confirmación automática de turnos por email' },
  ];

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {features.map((f, i) => (
        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#374151' }}>
          <CheckCircle size={15} style={{ color: check, flexShrink: 0, marginTop: '1px' }} />
          {f.text}
        </li>
      ))}
      {/* Ítem destacado: método de pago */}
      <li style={{
        display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px',
        background: highlighted ? '#eff6ff' : '#f0fdf4',
        border: `1px solid ${highlighted ? '#bfdbfe' : '#bbf7d0'}`,
        borderRadius: '8px', padding: '8px 10px', marginTop: '4px',
      }}>
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0, marginTop: '1px' }}>
          <CreditCard size={14} style={{ color: '#7c3aed' }} />
          <Banknote size={14} style={{ color: '#059669' }} />
        </div>
        <span style={{ color: '#1f2937', fontWeight: 600 }}>
          Cobro con Mercado Pago o Transferencia —{' '}
          <span style={{ color: highlighted ? '#1d4ed8' : '#16a34a' }}>vos elegís</span>
        </span>
      </li>
    </ul>
  );
}

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
                  <span className={styles.planPriceNormal}>$19.990</span>
                  <span className={styles.planPriceLabel}>/ mes</span>
                </div>
                <PlanFeatures />
                <Link href="/register?plan=monthly" className={`${styles.planButton} ${styles.planButtonSecondary}`}>
                  Elegir Mensual
                </Link>
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
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  equivale a <strong style={{ color: '#1d4ed8' }}>$10.000/mes</strong>
                </div>
                <PlanFeatures highlighted />
                <Link href="/register?plan=annual" className={`${styles.planButton} ${styles.planButtonPrimary}`}>
                  Elegir Anual
                </Link>
              </div>

              {/* PLAN SEMESTRAL */}
              <div className={styles.planCard}>
                <h3 className={styles.planTitle}>Plan Semestral</h3>
                <p className={styles.planDescription}>Ideal para probar a mediano plazo.</p>
                <div className={styles.planPriceContainer}>
                  <span className={styles.planPriceNormal}>$80.000</span>
                  <span className={styles.planPriceLabel}>/ único</span>
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  equivale a <strong style={{ color: '#374151' }}>$13.333/mes</strong>
                </div>
                <PlanFeatures />
                <Link href="/register?plan=semestral" className={`${styles.planButton} ${styles.planButtonSecondary}`}>
                  Elegir Semestral
                </Link>
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
