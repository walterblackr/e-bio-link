import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Botón de Arrepentimiento · ebiolink.app',
  description: 'Ejercé tu derecho de arrepentimiento según la Ley 24.240 de Defensa del Consumidor.',
};

const bg = '#05071a';
const border = 'rgba(255,255,255,0.07)';
const textSecondary = 'rgba(255,255,255,0.65)';
const blue = '#3b82f6';

export default function ArrepentimientoPage() {
  return (
    <div style={{ background: bg, minHeight: '100vh', color: '#fff', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>

      {/* Header */}
      <header style={{ borderBottom: `1px solid ${border}`, padding: '20px 24px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
            ← Volver al inicio
          </Link>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>ebiolink.app</span>
        </div>
      </header>

      {/* Contenido */}
      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '60px 24px' }}>

        {/* Badge legal */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(59,130,246,0.1)', border: `1px solid rgba(59,130,246,0.25)`, borderRadius: '100px', padding: '6px 14px', marginBottom: '24px' }}>
          <span style={{ fontSize: '12px', color: blue, fontWeight: 600, letterSpacing: '0.05em' }}>LEY 24.240 · DEFENSA DEL CONSUMIDOR</span>
        </div>

        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: '16px' }}>
          Botón de Arrepentimiento
        </h1>
        <p style={{ fontSize: '16px', color: textSecondary, lineHeight: 1.75, marginBottom: '40px' }}>
          Conforme al artículo 34 de la Ley 24.240 de Defensa del Consumidor y la Resolución 424/2020
          de la Secretaría de Comercio Interior, podés revocar la aceptación del servicio dentro de
          los <strong style={{ color: '#fff' }}>10 días hábiles</strong> desde la contratación, sin
          necesidad de justificar tu decisión y sin ningún costo adicional.
        </p>

        {/* Garantía propia */}
        <div style={{ background: 'rgba(71,204,136,0.08)', border: '1px solid rgba(71,204,136,0.2)', borderRadius: '14px', padding: '24px', marginBottom: '32px' }}>
          <p style={{ fontSize: '15px', color: '#fff', fontWeight: 600, marginBottom: '6px' }}>Nuestra garantía de 14 días</p>
          <p style={{ fontSize: '14px', color: textSecondary, lineHeight: 1.7 }}>
            Más allá de lo que establece la ley, en e-bio-link ofrecemos <strong style={{ color: '#fff' }}>14 días corridos</strong> de garantía
            de devolución. Si en ese período sentís que el sistema no te ahorró tiempo, te devolvemos el dinero sin preguntas.
          </p>
        </div>

        {/* Cómo ejercerlo */}
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
          ¿Cómo solicitarlo?
        </h2>
        <p style={{ fontSize: '15px', color: textSecondary, lineHeight: 1.75, marginBottom: '24px' }}>
          Enviá un email a{' '}
          <a href="mailto:ebiolinkarg@gmail.com?subject=Solicitud%20de%20arrepentimiento" style={{ color: blue, textDecoration: 'none', fontWeight: 600 }}>
            ebiolinkarg@gmail.com
          </a>{' '}
          con el asunto <strong style={{ color: '#fff' }}>"Solicitud de arrepentimiento"</strong> e incluí:
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            'Tu nombre completo',
            'El email con el que contrataste el servicio',
            'La fecha de contratación',
            'El CBU o alias al que querés recibir el reintegro (si pagaste por transferencia)',
          ].map((item, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', color: textSecondary, lineHeight: 1.6 }}>
              <span style={{ color: blue, fontWeight: 700, flexShrink: 0 }}>·</span>
              {item}
            </li>
          ))}
        </ul>

        {/* CTA email */}
        <a
          href="mailto:ebiolinkarg@gmail.com?subject=Solicitud%20de%20arrepentimiento"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: blue, color: '#fff', fontWeight: 700, padding: '14px 28px', borderRadius: '10px', textDecoration: 'none', fontSize: '15px' }}
        >
          Enviar solicitud por email →
        </a>

        {/* Plazos */}
        <div style={{ marginTop: '48px', borderTop: `1px solid ${border}`, paddingTop: '32px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>Plazos de reintegro</h2>
          <p style={{ fontSize: '14px', color: textSecondary, lineHeight: 1.75 }}>
            Una vez recibida tu solicitud, procesamos el reintegro en un plazo máximo de{' '}
            <strong style={{ color: '#fff' }}>5 días hábiles</strong>. Si abonaste con Mercado Pago, la devolución
            se acredita en tu cuenta de MP. Si abonaste por transferencia, realizamos la devolución al CBU/alias que nos indiques.
          </p>
        </div>

        {/* Contacto adicional */}
        <div style={{ marginTop: '32px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${border}`, borderRadius: '12px', padding: '20px' }}>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
            Para cualquier consulta adicional sobre tu derecho de arrepentimiento podés contactarnos en{' '}
            <a href="mailto:ebiolinkarg@gmail.com" style={{ color: blue, textDecoration: 'none' }}>ebiolinkarg@gmail.com</a>.
            También podés consultar tus derechos como consumidor en{' '}
            <a href="https://www.argentina.gob.ar/economia/comercio/defensa-del-consumidor" target="_blank" rel="noopener noreferrer" style={{ color: blue, textDecoration: 'none' }}>
              argentina.gob.ar/defensa-del-consumidor
            </a>.
          </p>
        </div>

      </main>
    </div>
  );
}
