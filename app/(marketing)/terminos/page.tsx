import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos de Uso · ebiolink.app',
  description: 'Condiciones de uso de la plataforma ebiolink.app para profesionales de la salud.',
};

const bg = '#05071a';
const border = 'rgba(255,255,255,0.07)';
const textSecondary = 'rgba(255,255,255,0.65)';

export default function TerminosPage() {
  return (
    <div style={{ background: bg, minHeight: '100vh', color: '#fff', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>

      {/* Header */}
      <header style={{ borderBottom: `1px solid ${border}`, padding: '20px 24px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
            ← Volver al inicio
          </Link>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>ebiolink.app</span>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '56px 24px 80px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
          Términos de Uso
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '48px' }}>
          Última actualización: marzo de 2026
        </p>

        <Section title="1. Descripción del servicio">
          <p>
            ebiolink.app es una plataforma digital para profesionales de la salud independientes que permite crear un perfil de biolink, gestionar turnos online, sincronizar con Google Calendar y recibir pagos de pacientes. El servicio es operado bajo el nombre comercial <strong style={{ color: '#fff' }}>e-bio-link</strong>.
          </p>
        </Section>

        <Section title="2. Quién puede usar el servicio">
          <p>Para registrarte y usar ebiolink.app debés:</p>
          <ul>
            <li>Ser un profesional de la salud habilitado para ejercer en la República Argentina</li>
            <li>Ser mayor de 18 años</li>
            <li>Proporcionar información veraz y actualizada al registrarte</li>
            <li>Contar con una cuenta de Google activa para la integración de calendario</li>
          </ul>
          <p style={{ marginTop: '12px' }}>
            El uso del servicio para actividades ilegales, fraudulentas o que perjudiquen a terceros está estrictamente prohibido.
          </p>
        </Section>

        <Section title="3. Responsabilidades del profesional">
          <p>Al usar ebiolink.app, el profesional es responsable de:</p>
          <ul>
            <li>La veracidad de los datos de su perfil (nombre, especialidad, matrícula)</li>
            <li>La exactitud de su disponibilidad horaria y precios publicados</li>
            <li>El tratamiento de los datos personales de sus pacientes, cumpliendo con la Ley 25.326 de Protección de Datos Personales de Argentina</li>
            <li>La atención efectiva de los turnos confirmados</li>
            <li>Mantener la confidencialidad de sus credenciales de acceso</li>
          </ul>
          <p style={{ marginTop: '12px' }}>
            ebiolink.app actúa como herramienta de gestión y no es parte de la relación médico-paciente ni responsable por la calidad de los servicios profesionales prestados.
          </p>
        </Section>

        <Section title="4. Planes, precios y pagos">
          <p>
            El servicio se ofrece mediante suscripción. Los precios vigentes son los publicados en <Link href="/#precios" style={{ color: '#60a5fa' }}>ebiolink.app/#precios</Link> al momento de la contratación.
          </p>
          <ul>
            <li><strong style={{ color: '#fff' }}>Plan Mensual:</strong> se abona mensualmente. Sin permanencia mínima.</li>
            <li><strong style={{ color: '#fff' }}>Plan Semestral y Anual:</strong> pago único por el período contratado. Sin renovación automática. Sin cuotas adicionales.</li>
          </ul>
          <p style={{ marginTop: '12px' }}>
            Los pagos de suscripción se procesan a través de Mercado Pago. Una vez acreditado el pago, se activa el acceso a la plataforma.
          </p>
        </Section>

        <Section title="5. Cancelación y reembolsos">
          <ul>
            <li><strong style={{ color: '#fff' }}>Plan Mensual:</strong> podés cancelar en cualquier momento. No se realizan reembolsos por el mes en curso.</li>
            <li><strong style={{ color: '#fff' }}>Planes Semestral y Anual:</strong> por ser pagos únicos sin renovación, no se ofrecen reembolsos parciales una vez activado el acceso.</li>
          </ul>
          <p style={{ marginTop: '12px' }}>
            Para solicitar la cancelación de tu cuenta, escribinos a <a href="mailto:ebiolinkarg@gmail.com" style={{ color: '#60a5fa' }}>ebiolinkarg@gmail.com</a>.
          </p>
        </Section>

        <Section title="6. Disponibilidad del servicio">
          <p>
            Nos esforzamos por mantener el servicio disponible de forma continua, pero no garantizamos una disponibilidad del 100%. Pueden producirse interrupciones por mantenimiento, actualizaciones o causas ajenas a nuestro control (fallos de proveedores de infraestructura, cortes de internet, etc.).
          </p>
          <p style={{ marginTop: '12px' }}>
            No somos responsables por pérdidas económicas o perjuicios derivados de la no disponibilidad temporal del servicio.
          </p>
        </Section>

        <Section title="7. Limitación de responsabilidad">
          <p>
            ebiolink.app provee la plataforma tecnológica. No somos responsables por:
          </p>
          <ul>
            <li>Ausencias o cancelaciones de pacientes</li>
            <li>Errores en los datos ingresados por el profesional o el paciente</li>
            <li>Disputas entre profesionales y pacientes</li>
            <li>Fallos en servicios de terceros (Google Calendar, Mercado Pago, etc.)</li>
            <li>Pérdidas económicas indirectas o consecuentes</li>
          </ul>
        </Section>

        <Section title="8. Suspensión de cuentas">
          <p>
            Nos reservamos el derecho de suspender o dar de baja una cuenta sin previo aviso en los siguientes casos:
          </p>
          <ul>
            <li>Incumplimiento de estos términos</li>
            <li>Uso fraudulento o abusivo de la plataforma</li>
            <li>Información falsa en el perfil profesional</li>
            <li>Falta de pago de la suscripción activa</li>
          </ul>
        </Section>

        <Section title="9. Propiedad intelectual">
          <p>
            El contenido, diseño, código y marca de ebiolink.app son propiedad de sus creadores. Se permite el uso del servicio según estos términos, pero no la reproducción, copia o distribución de ninguna parte de la plataforma sin autorización expresa.
          </p>
          <p style={{ marginTop: '12px' }}>
            El profesional conserva la titularidad de su propio contenido (foto, descripción, etc.) y nos otorga una licencia para mostrarlo en la plataforma.
          </p>
        </Section>

        <Section title="10. Modificaciones a los términos">
          <p>
            Podemos modificar estos términos en cualquier momento. Los cambios se publicarán en esta página con la fecha de actualización. El uso continuado del servicio tras los cambios implica la aceptación de los nuevos términos.
          </p>
        </Section>

        <Section title="11. Ley aplicable y jurisdicción">
          <p>
            Estos términos se rigen por las leyes de la República Argentina. Para cualquier controversia, las partes se someten a la jurisdicción de los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires.
          </p>
        </Section>

        <Section title="12. Contacto">
          <p>
            Para consultas sobre estos términos o para solicitar la cancelación de tu cuenta, escribinos a{' '}
            <a href="mailto:ebiolinkarg@gmail.com" style={{ color: '#60a5fa' }}>ebiolinkarg@gmail.com</a>.
          </p>
        </Section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${border}`, padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
          © 2026 ebiolink.app ·{' '}
          <Link href="/privacidad" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Política de Privacidad</Link>
        </p>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '40px', paddingBottom: '40px', borderBottom: `1px solid ${border}` }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>{title}</h2>
      <div style={{ fontSize: '15px', color: textSecondary, lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: '0' }}>
        {children}
      </div>
    </section>
  );
}
