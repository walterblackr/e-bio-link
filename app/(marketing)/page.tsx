"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Link2, Calendar, Video, Mail, CreditCard, ArrowRight, Clock,
  TrendingDown, CheckCircle, ChevronDown, ChevronUp, Menu, X,
  Banknote, Star, CalendarDays, ClipboardList,
} from "lucide-react";

// ─── Paleta global (estilo CloudPeak) ───────────────────────────────────────
const C = {
  bg:       "#05071a",          // fondo principal
  card:     "#0a0e28",          // tarjetas
  cardAlt:  "#0d1230",          // tarjetas alternativas / hover
  border:   "rgba(255,255,255,0.07)",
  borderHl: "rgba(59,130,246,0.5)",
  textPrimary:   "#ffffff",
  textSecondary: "rgba(255,255,255,0.55)",
  textMuted:     "rgba(255,255,255,0.3)",
  blue:   "#3b82f6",
  orange: "#f97316",
  green:  "#47cc88",
};

const DEMO_URL      = "https://e-bio-link-cr-v-bruce.vercel.app/";
const CONTACT_EMAIL = "mailto:ebiolinkarg@gmail.com";

const FEATURES = [
  { icon: <Link2 size={20} />,      title: "Biolink personalizado",     desc: "Tu perfil en ebiolink.app/tu-nombre con foto, bio y colores de tu marca.",                                       accent: "#818cf8" },
  { icon: <Calendar size={20} />,   title: "Agenda online 24/7",        desc: "Los pacientes reservan solos desde cualquier dispositivo, sin llamadas ni mensajes.",                            accent: "#60a5fa" },
  { icon: <CalendarDays size={20}/>, title: "Google Calendar",          desc: "Sincronización automática con tu cuenta de Google actual. Nada nuevo que aprender.",                             accent: "#4ade80" },
  { icon: <Video size={20} />,      title: "Google Meet automático",    desc: "El link de videollamada se genera solo para consultas virtuales. Sin pasos extra.",                              accent: "#f87171" },
  { icon: <Mail size={20} />,       title: "Confirmaciones por email",  desc: "El paciente y vos reciben un email con todos los detalles del turno confirmado.",                               accent: "#fbbf24" },
  { icon: <div style={{ display:"flex", gap:"3px" }}><CreditCard size={17}/><Banknote size={17}/></div>,
                                    title: "Cobro flexible",            desc: "Mercado Pago o transferencia bancaria — vos elegís cómo recibir el pago.",                                       accent: "#34d399" },
];

const PLAN_FEATURES = [
  "Biolink personalizado (ebiolink.app/tu-nombre)",
  "Agenda online — pacientes reservan solos, 24/7",
  "Sincronización con Google Calendar",
  "Videollamadas vía Google Meet (consultas virtuales)",
  "Confirmación automática de turnos por email",
];

const FAQS = [
  { q: "¿Cuánto tarda configurarlo todo?",          a: "Aproximadamente 15 minutos. El onboarding es un wizard guiado paso a paso: perfil → Google Calendar → tipos de consulta → método de pago." },
  { q: "¿Los pacientes necesitan crear una cuenta?", a: "No. Reservan directamente desde tu biolink sin registrarse ni descargar nada. Solo ingresan su nombre, email y eligen el horario." },
  { q: "¿Puedo usar mi Google Calendar actual?",     a: "Sí. Conectás tu cuenta de Google existente y los turnos confirmados aparecen automáticamente en tu calendario, con Google Meet incluido si la consulta es virtual." },
  { q: "¿Cómo recibo los pagos?",                   a: "Directamente a tu cuenta de Mercado Pago o mediante transferencia bancaria — vos elegís cuál preferís. Los fondos van a vos sin intermediarios." },
  { q: "¿Puedo cancelar el plan mensual cuando quiero?", a: "Sí. El plan mensual no tiene permanencia mínima. Los planes anuales y semestrales son pago único sin renovación automática — no hay sorpresas." },
  { q: "¿Tengo soporte si tengo un problema?",       a: "La plataforma está pensada para que puedas autogestionarte sin depender de nadie. Si hay algun inconveniente o algo del sistema falla, lo atendemos. Pero no es un servicio de consultoría: la idea es que tengas el control, sin esperar que alguien te diga qué hacer." },
];

function Badge({ label, accent = C.blue }: { label: string; accent?: string }) {
  return (
    <span style={{
      display: "inline-block",
      background: `${accent}22`,
      color: accent,
      fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em",
      padding: "4px 14px", borderRadius: "100px", textTransform: "uppercase" as const,
      marginBottom: "16px", border: `1px solid ${accent}33`,
    }}>{label}</span>
  );
}

function SectionHeading({ badge, title, subtitle, badgeAccent }: { badge: string; title: string; subtitle?: string; badgeAccent?: string }) {
  return (
    <div style={{ textAlign: "center", marginBottom: "52px" }}>
      <Badge label={badge} accent={badgeAccent} />
      <h2 style={{ fontSize: "clamp(1.7rem, 3vw, 2.4rem)", fontWeight: 800, color: C.textPrimary, marginBottom: subtitle ? "12px" : 0, lineHeight: 1.2 }}>
        {title}
      </h2>
      {subtitle && <p style={{ fontSize: "15px", color: C.textSecondary, maxWidth: "480px", margin: "0 auto" }}>{subtitle}</p>}
    </div>
  );
}

function PlanFeature({ text, hl = false }: { text: string; hl?: boolean }) {
  return (
    <li style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13px", color: hl ? "rgba(255,255,255,0.85)" : C.textSecondary }}>
      <CheckCircle size={14} style={{ color: hl ? C.blue : C.green, flexShrink: 0, marginTop: "2px" }} />
      {text}
    </li>
  );
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled]             = useState(false);
  const [openFaq, setOpenFaq]               = useState<number | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: "Características", href: "#caracteristicas" },
    { label: "Precios",          href: "#precios" },
    { label: "Preguntas",        href: "#faq" },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <style>{`
        html { scroll-behavior: smooth; }
        @media (max-width: 768px) {
          .nav-desktop  { display: none !important; }
          .nav-burger   { display: flex !important; }
        }
        @media (min-width: 769px) {
          .nav-burger   { display: none !important; }
        }
        .feat-card:hover {
          background: ${C.cardAlt} !important;
          border-color: rgba(59,130,246,0.25) !important;
        }
        .plan-ghost:hover { border-color: rgba(255,255,255,0.18) !important; }
        .faq-item:hover   { border-color: rgba(255,255,255,0.14) !important; }
        .nav-link:hover   { color: #fff !important; }
        @media (max-width: 768px) {
          .hero-split      { flex-direction: column !important; }
          .hero-phone-wrap { display: none !important; }
          .hero-split-text { text-align: center !important; align-items: center !important; }
          .hero-split-text > div { justify-content: center !important; }
          .como-funciona   { flex-direction: column !important; }
          .como-funciona > div:first-child { width: 100% !important; max-width: 100% !important; }
          .panel-split     { flex-direction: column !important; }
          .panel-img-wrap  { max-width: 100% !important; }
        }
      `}</style>

      {/* ══════════ NAVBAR ══════════ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(5,7,26,0.92)" : "transparent",
        borderBottom: scrolled ? `1px solid ${C.border}` : "none",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        transition: "background 0.3s, border 0.3s",
      }}>
        <div style={{ maxWidth: "1060px", margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>

          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
            <img src="/imgLogoIcon.svg" alt="" style={{ width: "28px", height: "28px" }} />
            <span style={{ fontFamily: "var(--font-shadows)", fontSize: "20px", color: "white", lineHeight: 1 }}>
              e-bio-link
            </span>
          </Link>

          <div className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            {navLinks.map(l => (
              <a key={l.href} href={l.href} className="nav-link" style={{ fontSize: "14px", fontWeight: 500, textDecoration: "none", color: C.textSecondary, transition: "color 0.2s" }}>
                {l.label}
              </a>
            ))}
            <a href={DEMO_URL} target="_blank" rel="noopener noreferrer" className="nav-link" style={{ fontSize: "14px", fontWeight: 500, textDecoration: "none", color: C.textSecondary, transition: "color 0.2s" }}>
              Demo
            </a>
            <Link href="/login" style={{
              fontSize: "14px", fontWeight: 600, padding: "8px 20px", borderRadius: "8px",
              border: `1.5px solid rgba(255,255,255,0.15)`, color: C.textSecondary,
              textDecoration: "none", transition: "all 0.2s", background: "transparent",
            }}>
              Iniciar sesión
            </Link>
            <Link href="/register?plan=monthly" style={{
              fontSize: "14px", fontWeight: 600, padding: "8px 20px", borderRadius: "8px",
              border: `1.5px solid rgba(255,255,255,0.2)`, color: "white",
              textDecoration: "none", transition: "all 0.2s", background: "rgba(255,255,255,0.05)",
            }}>
              Empezar
            </Link>
          </div>

          <button className="nav-burger" onClick={() => setMobileMenuOpen(v => !v)}
            style={{ display: "none", background: "none", border: "none", cursor: "pointer", color: "white", padding: "4px", alignItems: "center" }}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <>
          <div onClick={() => setMobileMenuOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 99 }} />
          <div style={{ background: "#080c22", borderTop: `1px solid ${C.border}`, padding: "12px 24px 24px", position: "relative", zIndex: 101 }}>
            {navLinks.map(l => (
              <a key={l.href} href={l.href} onClick={() => setMobileMenuOpen(false)}
                style={{ display: "block", padding: "13px 0", fontSize: "16px", fontWeight: 500, textDecoration: "none", color: "rgba(255,255,255,0.8)", borderBottom: `1px solid ${C.border}` }}>
                {l.label}
              </a>
            ))}
            <a href={DEMO_URL} target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)}
              style={{ display: "block", padding: "13px 0", fontSize: "16px", fontWeight: 500, textDecoration: "none", color: "rgba(255,255,255,0.8)", borderBottom: `1px solid ${C.border}` }}>
              Demo
            </a>
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}
              style={{ display: "block", padding: "13px 0", fontSize: "16px", fontWeight: 500, textDecoration: "none", color: "rgba(255,255,255,0.8)", borderBottom: `1px solid ${C.border}` }}>
              Iniciar sesión
            </Link>
            <Link href="/register?plan=monthly" onClick={() => setMobileMenuOpen(false)}
              style={{ display: "block", marginTop: "16px", textAlign: "center", background: C.orange, color: "white", fontWeight: 700, padding: "13px", borderRadius: "10px", textDecoration: "none" }}>
              Empezar ahora
            </Link>
          </div>
          </>
        )}
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "72px 24px 36px", textAlign: "center", position: "relative", overflow: "hidden",
      }}>
        {/* Blob principal — glow azul centrado-bajo */}
        <div style={{ position: "absolute", bottom: "-10%", left: "50%", transform: "translateX(-50%)", width: "900px", height: "600px", background: "radial-gradient(ellipse, rgba(37,99,235,0.45) 0%, rgba(59,130,246,0.15) 45%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />
        {/* Blob secundario — acento más saturado al centro */}
        <div style={{ position: "absolute", top: "55%", left: "50%", transform: "translate(-50%,-50%)", width: "500px", height: "400px", background: "radial-gradient(ellipse, rgba(99,102,241,0.25) 0%, transparent 65%)", filter: "blur(24px)", pointerEvents: "none" }} />

        {/* Headline */}
        <h1 style={{ fontSize: "clamp(2.4rem, 6vw, 4.5rem)", fontWeight: 800, color: "white", lineHeight: 1.1, marginBottom: "10px", maxWidth: "860px", letterSpacing: "-0.02em", position: "relative", zIndex: 1 }}>
          Automatizá{" "}
          <span style={{ color: C.blue }}>tu agenda</span>
        </h1>

        {/* Split row: texto izq + phone der */}
        <div className="hero-split" style={{ display: "flex", alignItems: "center", gap: "48px", maxWidth: "720px", width: "100%", margin: "0 0 24px", position: "relative", zIndex: 1 }}>

          {/* Texto izquierda */}
          <div className="hero-split-text" style={{ flex: 1, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
            <p style={{ fontSize: "clamp(1rem, 1.8vw, 1.1rem)", color: C.textSecondary, lineHeight: 1.8, marginBottom: "28px" }}>
              Dejá de perder 16 horas al mes coordinando turnos. <span style={{ fontFamily: "var(--font-shadows)", fontSize: "1.1em", color: "white" }}>ebiolink</span> digitaliza tu consultorio en 15 minutos, sin depender de nadie.
            </p>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <Link href="/register?plan=monthly" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: C.orange, color: "white", fontWeight: 700, padding: "14px 28px", borderRadius: "10px", textDecoration: "none", fontSize: "15px", boxShadow: "0 4px 24px rgba(249,115,22,0.4)" }}>
                Empezar ahora <ArrowRight size={17} />
              </Link>
              <a href={CONTACT_EMAIL} style={{ display: "inline-flex", alignItems: "center", gap: "8px", border: `1.5px solid rgba(255,255,255,0.18)`, color: "white", fontWeight: 600, padding: "14px 28px", borderRadius: "10px", textDecoration: "none", fontSize: "15px", background: "rgba(255,255,255,0.04)" }}>
                <Mail size={17} /> Contacto
              </a>
            </div>
            <p style={{ fontSize: "12px", color: C.textMuted, marginTop: "10px" }}>
              Garantía de 14 días · Si no es para vos, reintegro total
            </p>
          </div>

          {/* Phone derecha con glow */}
          <div className="hero-phone-wrap" style={{ flexShrink: 0, position: "relative", marginTop: "-60px", marginBottom: "-60px" }}>
            <div style={{
              position: "absolute", bottom: "-14px", left: "50%", transform: "translateX(-50%)",
              width: "240px", height: "90px",
              background: "radial-gradient(ellipse, rgba(59,130,246,0.55) 0%, transparent 70%)",
              filter: "blur(16px)", zIndex: 0,
            }} />
            <img
              src="/bio.png"
              alt="Biolink de ejemplo en móvil"
              style={{ width: "310px", display: "block", position: "relative", zIndex: 1 }}
            />
          </div>

        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderTop: `1px solid ${C.border}`, paddingTop: "32px", width: "100%", maxWidth: "580px", position: "relative", zIndex: 1 }}>
          {[
            { num: "16 hs/mes", label: "recuperadas en gestión" },
            { num: "+30%",      label: "de ingresos recuperados" },
            { num: "15 min",    label: "para configurar todo" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center", borderLeft: i > 0 ? `1px solid ${C.border}` : "none", padding: "0 16px" }}>
              <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "white", lineHeight: 1.1 }}>{s.num}</div>
              <div style={{ fontSize: "12px", color: C.textMuted, marginTop: "6px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ PROBLEMA ══════════ */}
      <section style={{ padding: "80px 24px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: "1060px", margin: "0 auto" }}>
          <SectionHeading badge="El Problema" title="La gestión por WhatsApp te roba tiempo y dinero" badgeAccent="#f87171" />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 460px), 1fr))", gap: "20px" }}>

            {/* Tiempo */}
            <div style={{ background: C.card, borderRadius: "16px", padding: "32px", border: `1px solid ${C.border}`, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: "3px", height: "100%", background: C.blue }} />
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <div style={{ width: "44px", height: "44px", background: "rgba(59,130,246,0.12)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Clock size={22} color={C.blue} />
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: C.textPrimary }}>Tu tiempo vale más que esto</h3>
              </div>
              <p style={{ fontSize: "13px", color: C.textSecondary, marginBottom: "18px", lineHeight: 1.7 }}>
                Gestionar turnos por WhatsApp te toma <strong style={{ color: "white" }}>10 minutos por paciente</strong>. Si atendés un volumen estándar, la matemática es cruel:
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "12px 16px", fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
                <span>10 min/paciente</span>
                <ArrowRight size={13} color="rgba(255,255,255,0.25)" />
                <span>4 hs/semana</span>
                <ArrowRight size={13} color="rgba(255,255,255,0.25)" />
                <span style={{ background: "rgba(248,113,113,0.15)", color: "#f87171", padding: "2px 10px", borderRadius: "6px", border: "1px solid rgba(248,113,113,0.2)" }}>16 HS AL MES</span>
              </div>
              <div style={{ marginTop: "16px", padding: "14px", background: "rgba(59,130,246,0.08)", borderRadius: "10px", border: "1px solid rgba(59,130,246,0.2)" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: C.blue, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>La Solución</p>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>Nuestro sistema reduce ese tiempo a <strong style={{ color: "white" }}>0 minutos</strong>. Tu agenda se llena sola.</p>
              </div>
            </div>

            {/* Dinero */}
            <div style={{ background: C.card, borderRadius: "16px", padding: "32px", border: `1px solid ${C.border}`, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: "3px", height: "100%", background: "#f87171" }} />
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <div style={{ width: "44px", height: "44px", background: "rgba(248,113,113,0.1)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <TrendingDown size={22} color="#f87171" />
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: C.textPrimary }}>El costo real del ausentismo</h3>
              </div>
              <p style={{ fontSize: "13px", color: C.textSecondary, marginBottom: "18px", lineHeight: 1.7 }}>
                Modelo tradicional sin seña. Tasa de ausentismo promedio: <strong style={{ color: "white" }}>30%</strong>
              </p>
              <div style={{ borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(248,113,113,0.15)" }}>
                {[
                  { label: "Proyección (20 pacientes × $40.000)", val: "$800.000",  striked: true },
                  { label: "Dinero perdido al mes",               val: "−$240.000", red: true     },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(248,113,113,0.1)" }}>
                    <span style={{ fontSize: "12px", color: C.textSecondary }}>{row.label}</span>
                    <span style={{ fontSize: "13px", fontWeight: 700, textDecoration: row.striked ? "line-through" : "none", color: row.red ? "#f87171" : "rgba(255,255,255,0.6)" }}>{row.val}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: "12px", padding: "16px", marginTop: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "11px", letterSpacing: "0.12em", color: "#f87171", textTransform: "uppercase", marginBottom: "6px" }}>
                  Pérdida anual estimada
                </div>
                <div style={{ fontSize: "clamp(22px, 7vw, 38px)", fontWeight: 800, color: "#f87171", textShadow: "0 0 32px rgba(248,113,113,0.5)", lineHeight: 1, whiteSpace: "nowrap" }}>
                  −$2.880.000
                </div>
              </div>
              <div style={{ marginTop: "14px", padding: "12px 14px", background: "rgba(71,204,136,0.08)", borderRadius: "10px", border: "1px solid rgba(71,204,136,0.2)", fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
                Invertís <strong style={{ color: "white" }}>$120.000</strong> para dejar de perder casi <strong style={{ color: "white" }}>3 Millones</strong>. Con evitar 4 ausencias en el año, el sistema se paga solo.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section id="caracteristicas" style={{ padding: "80px 24px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: "1060px", margin: "0 auto" }}>
          <SectionHeading badge="Características" title="Todo lo que necesitás, nada de lo que no" subtitle="Una plataforma completa pensada exclusivamente para profesionales de la salud independientes." />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "16px" }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="feat-card" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "24px", transition: "background 0.2s, border-color 0.2s", cursor: "default" }}>
                <div style={{ width: "42px", height: "42px", background: `${f.accent}18`, borderRadius: "11px", display: "flex", alignItems: "center", justifyContent: "center", color: f.accent, marginBottom: "14px" }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: C.textPrimary, marginBottom: "8px" }}>{f.title}</h3>
                <p style={{ fontSize: "13px", color: C.textSecondary, lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ PANEL ══════════ */}
      <section style={{ padding: "80px 24px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: "1060px", margin: "0 auto" }}>
          <SectionHeading
            badge="Tu panel"
            title="Todo desde un solo lugar"
            subtitle="Sin llamadas, sin asistente. Configurá tu consultorio y gestioná tus turnos desde cualquier dispositivo."
            badgeAccent="#a78bfa"
          />
          <div className="panel-split" style={{ display: "flex", alignItems: "center", gap: "64px", marginTop: "48px" }}>

            {/* Laptop izquierda */}
            <div className="panel-img-wrap" style={{ flex: "0 0 auto", width: "100%", maxWidth: "520px", position: "relative" }}>
              <div style={{ position: "absolute", bottom: "-20px", left: "50%", transform: "translateX(-50%)", width: "340px", height: "80px", background: "radial-gradient(ellipse, rgba(167,139,250,0.4) 0%, transparent 70%)", filter: "blur(20px)", zIndex: 0 }} />
              <img src="/bioback.png" alt="Panel de control de e-bio-link" style={{ width: "100%", display: "block", position: "relative", zIndex: 1 }} />
            </div>

            {/* Items derecha */}
            <div style={{ flex: 1 }}>
              {[
                { icon: <CreditCard size={20} />, color: "#a78bfa", title: "Cobrá como quieras", desc: "Configurá Mercado Pago o transferencia bancaria. El dinero va directo a vos, sin intermediarios." },
                { icon: <CalendarDays size={20} />, color: "#34d399", title: "Armá tus horarios a tu medida", desc: "Definí días, franjas y tipos de consulta (presencial o videollamada). Podés tener múltiples esquemas." },
                { icon: <ClipboardList size={20} />, color: "#60a5fa", title: "Todos tus turnos en un lugar", desc: "Confirmá o rechazá solicitudes y consultá el historial de tus pacientes desde cualquier dispositivo." },
              ].map((item, i, arr) => (
                <div key={i} style={{ display: "flex", gap: "16px", alignItems: "flex-start", paddingBottom: i < arr.length - 1 ? "24px" : 0, marginBottom: i < arr.length - 1 ? "24px" : 0, borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ width: "42px", height: "42px", flexShrink: 0, background: `${item.color}18`, borderRadius: "11px", display: "flex", alignItems: "center", justifyContent: "center", color: item.color }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: C.textPrimary, marginBottom: "4px" }}>{item.title}</div>
                    <div style={{ fontSize: "13px", color: C.textSecondary, lineHeight: 1.65 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ══════════ PRECIOS ══════════ */}
      <section id="precios" style={{ padding: "80px 24px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: "1060px", margin: "0 auto" }}>
          <SectionHeading badge="Planes" title="Planes de inversión" subtitle="Con evitar 4 ausencias en todo el año el sistema ya se paga solo." badgeAccent={C.green} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "20px" }}>

            {/* Mensual — DESTACADO */}
            <div style={{ background: C.card, borderRadius: "16px", padding: "28px", border: `2px solid ${C.blue}`, boxShadow: "0 0 32px rgba(59,130,246,0.15)", position: "relative", display: "flex", flexDirection: "column" }}>
              <div style={{ position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)", background: C.blue, color: "white", fontSize: "10px", fontWeight: 700, padding: "4px 18px", borderRadius: "100px", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>RECOMENDADO</div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "white", marginBottom: "4px", marginTop: "8px" }}>Plan Mensual</h3>
              <p style={{ fontSize: "13px", color: C.textSecondary, marginBottom: "16px" }}>Menor inversión inicial, cancelá cuando quieras.</p>
              <div style={{ marginBottom: "20px" }}>
                <span style={{ fontSize: "2rem", fontWeight: 800, color: "white" }}>$19.990</span>
                <span style={{ fontSize: "14px", color: C.textMuted, marginLeft: "4px" }}>/ mes</span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: "9px" }}>
                {PLAN_FEATURES.map((f, i) => <PlanFeature key={i} text={f} hl />)}
                <li style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", background: "rgba(71,204,136,0.08)", border: "1px solid rgba(71,204,136,0.15)", borderRadius: "8px", padding: "8px 10px", marginTop: "4px", color: "rgba(255,255,255,0.7)" }}>
                  <div style={{ display: "flex", gap: "3px", flexShrink: 0 }}><CreditCard size={13} color="#a78bfa" /><Banknote size={13} color="#34d399" /></div>
                  Mercado Pago o Transferencia
                </li>
              </ul>
              <Link href="/register?plan=monthly" style={{ display: "block", textAlign: "center", background: C.orange, color: "white", fontWeight: 700, padding: "12px", borderRadius: "10px", textDecoration: "none", fontSize: "14px", boxShadow: "0 4px 16px rgba(249,115,22,0.35)", marginTop: "auto" }}>
                Elegir Mensual
              </Link>
            </div>

            {/* Anual */}
            <div className="plan-ghost" style={{ background: C.card, borderRadius: "16px", padding: "28px", border: `1px solid ${C.border}`, transition: "border-color 0.2s", display: "flex", flexDirection: "column" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "white", marginBottom: "4px", marginTop: "8px" }}>Plan Anual</h3>
              <p style={{ fontSize: "13px", color: C.textSecondary, marginBottom: "16px" }}>Congelá el precio hoy por 12 meses.</p>
              <div style={{ marginBottom: "4px" }}>
                <span style={{ fontSize: "2rem", fontWeight: 800, color: "white" }}>$120.000</span>
                <span style={{ fontSize: "14px", color: C.textMuted, marginLeft: "4px" }}>/ único</span>
              </div>
              <p style={{ fontSize: "12px", color: C.textSecondary, marginBottom: "20px" }}>
                equivale a <strong style={{ color: "rgba(255,255,255,0.8)" }}>$10.000/mes</strong>
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: "9px" }}>
                {PLAN_FEATURES.map((f, i) => <PlanFeature key={i} text={f} />)}
                <li style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", background: "rgba(71,204,136,0.08)", border: "1px solid rgba(71,204,136,0.15)", borderRadius: "8px", padding: "8px 10px", marginTop: "4px", color: "rgba(255,255,255,0.7)" }}>
                  <div style={{ display: "flex", gap: "3px", flexShrink: 0 }}><CreditCard size={13} color="#a78bfa" /><Banknote size={13} color="#34d399" /></div>
                  Mercado Pago o Transferencia
                </li>
              </ul>
              <Link href="/register?plan=annual" style={{ display: "block", textAlign: "center", background: "rgba(255,255,255,0.07)", color: "white", fontWeight: 700, padding: "12px", borderRadius: "10px", textDecoration: "none", fontSize: "14px", border: `1px solid ${C.border}`, marginTop: "auto" }}>
                Elegir Anual
              </Link>
            </div>

            {/* Semestral */}
            <div className="plan-ghost" style={{ background: C.card, borderRadius: "16px", padding: "28px", border: `1px solid ${C.border}`, transition: "border-color 0.2s", display: "flex", flexDirection: "column" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "white", marginBottom: "4px" }}>Plan Semestral</h3>
              <p style={{ fontSize: "13px", color: C.textSecondary, marginBottom: "16px" }}>Ideal para probar a mediano plazo.</p>
              <div style={{ marginBottom: "4px" }}>
                <span style={{ fontSize: "2rem", fontWeight: 800, color: "white" }}>$80.000</span>
                <span style={{ fontSize: "14px", color: C.textMuted, marginLeft: "4px" }}>/ único</span>
              </div>
              <p style={{ fontSize: "12px", color: C.textSecondary, marginBottom: "20px" }}>
                equivale a <strong style={{ color: "rgba(255,255,255,0.8)" }}>$13.333/mes</strong>
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: "9px" }}>
                {PLAN_FEATURES.map((f, i) => <PlanFeature key={i} text={f} />)}
                <li style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", background: "rgba(71,204,136,0.08)", border: "1px solid rgba(71,204,136,0.15)", borderRadius: "8px", padding: "8px 10px", marginTop: "4px", color: "rgba(255,255,255,0.7)" }}>
                  <div style={{ display: "flex", gap: "3px", flexShrink: 0 }}><CreditCard size={13} color="#a78bfa" /><Banknote size={13} color="#34d399" /></div>
                  Mercado Pago o Transferencia
                </li>
              </ul>
              <Link href="/register?plan=semestral" style={{ display: "block", textAlign: "center", background: "rgba(255,255,255,0.07)", color: "white", fontWeight: 700, padding: "12px", borderRadius: "10px", textDecoration: "none", fontSize: "14px", border: `1px solid ${C.border}`, marginTop: "auto" }}>
                Elegir Semestral
              </Link>
            </div>
          </div>
          <p style={{ textAlign: "center", fontSize: "13px", color: C.textSecondary, marginTop: "24px", lineHeight: 1.6 }}>
            Todos los planes incluyen{" "}
            <strong style={{ color: "white", whiteSpace: "nowrap" }}>
              <CreditCard size={13} color="#a78bfa" style={{ display: "inline", verticalAlign: "middle", marginRight: "3px" }} />
              Mercado Pago
            </strong>
            {" "}o{" "}
            <strong style={{ color: "white", whiteSpace: "nowrap" }}>
              <Banknote size={13} color="#34d399" style={{ display: "inline", verticalAlign: "middle", marginRight: "3px" }} />
              transferencia bancaria
            </strong>
            {" "}— vos elegís cómo cobrar.
          </p>
          <p style={{ textAlign: "center", fontSize: "12px", color: C.textMuted, marginTop: "10px" }}>
            Pensado para profesionales independientes.{" "}
            <a href={CONTACT_EMAIL} style={{ color: C.blue, textDecoration: "none", fontWeight: 600 }}>
              ¿Trabajás en una clínica? Escribinos →
            </a>
          </p>
        </div>
      </section>

      {/* ══════════ TESTIMONIOS ══════════ */}
      <section style={{ padding: "80px 24px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: "1060px", margin: "0 auto" }}>
          <SectionHeading badge="Resultados" title="Lo que dicen los profesionales" badgeAccent="#fbbf24" />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: "16px" }}>
            {[
              { quote: "Antes perdía como 2 horas por día mandando mensajes por WhatsApp para confirmar turnos. Ahora mi agenda se llena sola y yo me entero cuando ya está confirmado.",  name: "Valeria Gomez",    photo: "/profesional 1.webp", color: "#a78bfa", role: "Psicóloga",    city: "Buenos Aires", stars: 4 },
              { quote: "Lo de la seña fue un cambio enorme. Antes tenía 3 o 4 ausentes por semana. Desde que lo uso casi no me pasa. Ya se pagó solo varias veces.",                       name: "Rodrigo Pereyra",  photo: "/profesional 2.avif", color: "#34d399", role: "Psicólogo",    city: "Rosario",      stars: 5 },
              { quote: "En 15 minutos tuve todo configurado: mis horarios, los tipos de consulta y el calendario de Google conectado. Esperaba que fuera mucho más complicado.",             name: "Federico Alvarez", photo: "/profesional 3.avif", color: "#60a5fa", role: "Dermatólogo",  city: "Córdoba",      stars: 4 },
            ].map((t, i) => (
              <div key={i} style={{ background: C.card, borderRadius: "14px", padding: "28px", border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: "18px" }}>
                <div style={{ display: "flex", gap: "3px" }}>
                  {[1,2,3,4,5].map(s => <Star key={s} size={14} fill={s <= t.stars ? "#facc15" : "transparent"} color={s <= t.stars ? "#facc15" : "rgba(255,255,255,0.15)"} />)}
                </div>
                <p style={{ fontSize: "14px", color: C.textSecondary, lineHeight: 1.75, fontStyle: "italic", flex: 1 }}>
                  "{t.quote}"
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {t.photo ? (
                    <img src={t.photo} alt={t.name} style={{ width: "52px", height: "52px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${t.color}66`, flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: `${t.color}22`, border: `2px solid ${t.color}66`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", fontWeight: 700, color: t.color, flexShrink: 0 }}>
                      {t.initials}
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "white" }}>{t.name}</p>
                    <p style={{ fontSize: "12px", color: C.textMuted }}>{t.role} · {t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", marginTop: "32px", fontSize: "13px", color: C.textMuted }}>
            ¿Usás <span style={{ fontFamily: "var(--font-shadows)", fontSize: "15px", color: "rgba(255,255,255,0.6)" }}>ebiolink</span>?{" "}
            <a href="mailto:ebiolinkarg@gmail.com?subject=Mi%20experiencia%20con%20e-bio-link" style={{ color: C.blue, textDecoration: "none", fontWeight: 600 }}>
              Dejanos tu comentario →
            </a>
          </p>
        </div>
      </section>

      {/* ══════════ FAQ ══════════ */}
      <section id="faq" style={{ padding: "80px 24px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <SectionHeading badge="Preguntas Frecuentes" title="Todo lo que querés saber" badgeAccent={C.green} />

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {FAQS.map((faq, i) => (
              <div key={i} className="faq-item" style={{ background: C.card, borderRadius: "12px", border: openFaq === i ? `1.5px solid rgba(59,130,246,0.35)` : `1px solid ${C.border}`, overflow: "hidden", transition: "border-color 0.2s" }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "18px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
                  <span style={{ fontSize: "15px", fontWeight: 600, color: openFaq === i ? "white" : "rgba(255,255,255,0.85)" }}>{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={18} color={C.blue} style={{ flexShrink: 0 }} /> : <ChevronDown size={18} color={C.textMuted} style={{ flexShrink: 0 }} />}
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 20px 18px", fontSize: "14px", color: C.textSecondary, lineHeight: 1.75 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA FINAL ══════════ */}
      <section style={{ padding: "96px 24px", textAlign: "center", borderTop: `1px solid ${C.border}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "600px", height: "400px", background: "radial-gradient(ellipse, rgba(59,130,246,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: "540px", margin: "0 auto", position: "relative" }}>
          <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 800, color: "white", marginBottom: "14px" }}>
            ¿Listo para recuperar tu tiempo?
          </h2>
          <p style={{ fontSize: "15px", color: C.textSecondary, marginBottom: "36px" }}>
            Sin contrato, sin permanencia. Configuralo en 15 minutos.
          </p>
          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register?plan=monthly"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: C.orange, color: "white", fontWeight: 700, padding: "14px 28px", borderRadius: "10px", textDecoration: "none", fontSize: "15px", boxShadow: "0 4px 24px rgba(249,115,22,0.4)" }}>
              Empezar ahora <ArrowRight size={17} />
            </Link>
            <a href={CONTACT_EMAIL}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", border: `1.5px solid rgba(255,255,255,0.15)`, color: "white", fontWeight: 600, padding: "14px 28px", borderRadius: "10px", textDecoration: "none", fontSize: "15px", background: "rgba(255,255,255,0.04)" }}>
              <Mail size={17} /> Contacto
            </a>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "36px 24px" }}>
        <div style={{ maxWidth: "1060px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px", alignItems: "center", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <img src="/imgLogoIcon.svg" alt="" style={{ width: "22px", height: "22px" }} />
            <span style={{ fontFamily: "var(--font-shadows)", fontSize: "17px", color: "white" }}>e-bio-link</span>
          </div>
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", justifyContent: "center" }}>
            {[
                { label: "Demo",              href: DEMO_URL,       ext: true  },
              { label: "Iniciar sesión",   href: "/login",       ext: false },
              { label: "Privacidad",              href: "/privacidad",      ext: false },
              { label: "Términos de Uso",         href: "/terminos",        ext: false },
              { label: "Botón de arrepentimiento", href: "/arrepentimiento", ext: false },
            ].map(l => l.ext
              ? <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: C.textMuted, textDecoration: "none" }}>{l.label}</a>
              : <Link key={l.href} href={l.href} style={{ fontSize: "13px", color: C.textMuted, textDecoration: "none" }}>{l.label}</Link>
            )}
          </div>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.15)" }}>
            © 2026 e-bio-link · Gestión profesional de turnos médicos
          </p>
        </div>
      </footer>
    </div>
  );
}
