import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad · ebiolink.app',
  description: 'Cómo ebiolink.app recolecta, usa y protege tu información personal.',
};

const bg = '#05071a';
const border = 'rgba(255,255,255,0.07)';
const textSecondary = 'rgba(255,255,255,0.65)';

export default function PrivacidadPage() {
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
          Política de Privacidad
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '48px' }}>
          Última actualización: marzo de 2026
        </p>

        <Section title="1. Quiénes somos">
          <p>
            ebiolink.app es una plataforma SaaS para profesionales de la salud independientes radicados en Argentina. Permite gestionar turnos, agenda y cobros online. Operada por sus fundadores bajo el nombre comercial <strong>e-bio-link</strong>. Contacto: <a href="mailto:ebiolinkarg@gmail.com" style={{ color: '#60a5fa' }}>ebiolinkarg@gmail.com</a>
          </p>
        </Section>

        <Section title="2. Datos que recolectamos">
          <p><strong style={{ color: '#fff' }}>De los profesionales (usuarios registrados):</strong></p>
          <ul>
            <li>Nombre completo, especialidad y número de matrícula</li>
            <li>Dirección de correo electrónico y contraseña (almacenada con hash bcrypt)</li>
            <li>Foto de perfil (almacenada en Cloudinary)</li>
            <li>Descripción profesional y links de redes sociales</li>
            <li>Configuración de disponibilidad horaria y tipos de consulta</li>
            <li>Datos bancarios para cobro por transferencia (CBU/alias, banco, titular)</li>
          </ul>
          <p style={{ marginTop: '16px' }}><strong style={{ color: '#fff' }}>De los pacientes (no son usuarios registrados):</strong></p>
          <ul>
            <li>Nombre completo, correo electrónico y teléfono (ingresados al reservar un turno)</li>
            <li>Comprobante de pago (imagen o PDF, almacenado en Cloudinary)</li>
            <li>Notas opcionales sobre el motivo de consulta</li>
          </ul>
          <p style={{ marginTop: '16px' }}>
            Los datos de pacientes son visibles únicamente para el profesional al que corresponde el turno. No son compartidos con otros profesionales ni utilizados con fines de marketing.
          </p>
        </Section>

        <Section title="3. Integración con Google Calendar">
          <p>
            Al conectar tu cuenta de Google, ebiolink.app solicita acceso a los siguientes scopes:
          </p>
          <ul>
            <li><code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>calendar.events</code> — para crear y eliminar eventos de turnos confirmados</li>
            <li><code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>calendar.readonly</code> — para consultar disponibilidad y evitar superposiciones</li>
            <li><code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>userinfo.email</code> — para identificar la cuenta conectada</li>
          </ul>
          <p style={{ marginTop: '16px' }}>
            <strong style={{ color: '#fff' }}>Importante:</strong> Solo accedemos a eventos creados por ebiolink.app y a los bloques de tiempo ocupados (freebusy) para determinar disponibilidad. No leemos, almacenamos ni procesamos el contenido de otros eventos en tu calendario. Los tokens de acceso se almacenan cifrados en nuestra base de datos y nunca se exponen al cliente.
          </p>
          <p style={{ marginTop: '12px' }}>
            Podés revocar el acceso en cualquier momento desde <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>myaccount.google.com/permissions</a>.
          </p>
        </Section>

        <Section title="4. Integración con Mercado Pago">
          <p>
            Los cobros a pacientes se procesan directamente a través de Mercado Pago. ebiolink.app no almacena números de tarjeta ni datos bancarios de los pacientes. Solo guardamos el ID de pago y el estado de la transacción para registrar el turno como pagado.
          </p>
          <p style={{ marginTop: '12px' }}>
            Los profesionales pueden conectar su cuenta de Mercado Pago para recibir pagos directamente. Los tokens OAuth de Mercado Pago se almacenan cifrados en nuestra base de datos.
          </p>
        </Section>

        <Section title="5. Proveedores de servicios (subprocesadores)">
          <p>Utilizamos los siguientes servicios de terceros para operar la plataforma:</p>
          <ul>
            <li><strong style={{ color: '#fff' }}>Neon</strong> (neon.tech) — base de datos PostgreSQL serverless</li>
            <li><strong style={{ color: '#fff' }}>Cloudinary</strong> (cloudinary.com) — almacenamiento de imágenes y archivos</li>
            <li><strong style={{ color: '#fff' }}>Resend</strong> (resend.com) — envío de emails transaccionales</li>
            <li><strong style={{ color: '#fff' }}>Vercel</strong> (vercel.com) — hosting y deploy de la aplicación</li>
          </ul>
          <p style={{ marginTop: '12px' }}>
            Cada proveedor opera bajo sus propias políticas de privacidad y cumple con estándares de seguridad aplicables.
          </p>
        </Section>

        <Section title="6. Cookies y sesiones">
          <p>
            Utilizamos únicamente cookies de sesión <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>httpOnly</code> para mantener tu sesión autenticada. No utilizamos cookies de tracking, publicidad ni analítica de terceros.
          </p>
        </Section>

        <Section title="7. Seguridad">
          <p>
            Las contraseñas se almacenan con hash bcrypt. Los tokens de OAuth (Google y Mercado Pago) se cifran con AES-256-GCM antes de ser guardados en la base de datos. La comunicación con la plataforma se realiza exclusivamente mediante HTTPS.
          </p>
        </Section>

        <Section title="8. Tus derechos">
          <p>Podés ejercer en cualquier momento los siguientes derechos:</p>
          <ul>
            <li><strong style={{ color: '#fff' }}>Acceso:</strong> solicitar una copia de los datos que tenemos sobre vos</li>
            <li><strong style={{ color: '#fff' }}>Rectificación:</strong> corregir datos incorrectos o desactualizados</li>
            <li><strong style={{ color: '#fff' }}>Eliminación:</strong> solicitar la eliminación de tu cuenta y todos los datos asociados</li>
          </ul>
          <p style={{ marginTop: '12px' }}>
            Para ejercer estos derechos, escribinos a <a href="mailto:ebiolinkarg@gmail.com" style={{ color: '#60a5fa' }}>ebiolinkarg@gmail.com</a>. Responderemos dentro de los 10 días hábiles.
          </p>
        </Section>

        <Section title="9. Cambios a esta política">
          <p>
            Podemos actualizar esta política ocasionalmente. Cuando lo hagamos, actualizaremos la fecha al inicio de esta página. Si los cambios son significativos, te notificaremos por email.
          </p>
        </Section>

        <Section title="10. Contacto">
          <p>
            Si tenés preguntas sobre esta política o sobre cómo manejamos tus datos, escribinos a{' '}
            <a href="mailto:ebiolinkarg@gmail.com" style={{ color: '#60a5fa' }}>ebiolinkarg@gmail.com</a>.
          </p>
        </Section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${border}`, padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
          © 2026 ebiolink.app ·{' '}
          <Link href="/terminos" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Términos de Uso</Link>
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
