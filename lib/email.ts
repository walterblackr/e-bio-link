// Envío de emails transaccionales con Resend
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'ebiolinkarg@gmail.com';

// ── Tipos ────────────────────────────────────────────────────────────────────

interface BookingEmailData {
  paciente_nombre: string;
  paciente_email: string;
  medico_nombre: string;
  medico_email?: string;          // reply-to cuando el mail va al paciente
  medico_especialidad?: string;
  fecha_hora: string; // ISO 8601
  evento_nombre?: string;
  modalidad?: 'virtual' | 'presencial';
  meet_link?: string | null;
  monto?: number | string;
  booking_id?: number | string;
  direccion?: string | null;
  cobro_tipo?: 'total' | 'sena';
  precio_total?: number | string;
}

interface ProfesionalNotifData extends BookingEmailData {
  medico_email: string;
  paciente_telefono?: string;
  notas?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}

function baseStyle(): string {
  return `
    body { margin: 0; padding: 0; background: #f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .container { max-width: 560px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
    .header { background: #1d4ed8; padding: 28px 32px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; }
    .header p { margin: 4px 0 0; color: #bfdbfe; font-size: 13px; }
    .body { padding: 28px 32px; }
    .field { margin-bottom: 16px; }
    .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; margin-bottom: 3px; }
    .value { font-size: 15px; color: #111827; font-weight: 500; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
    .amount { font-size: 26px; font-weight: 800; color: #16a34a; text-align: center; padding: 16px; background: #f0fdf4; border-radius: 8px; margin: 20px 0; }
    .meet-btn { display: inline-block; background: #1d4ed8; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px; text-decoration: none; margin: 12px 0; }
    .footer { padding: 16px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
    .tag { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 12px; font-weight: 600; }
    .tag-virtual { background: #dbeafe; color: #1d4ed8; }
    .tag-presencial { background: #dcfce7; color: #16a34a; }
  `;
}

// ── 1. Confirmación al paciente ───────────────────────────────────────────────

export async function sendBookingConfirmation(data: BookingEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY no configurada — email no enviado');
    return;
  }

  const fecha = formatFecha(data.fecha_hora);
  const modalidadTag = data.modalidad
    ? `<span class="tag tag-${data.modalidad}">${data.modalidad === 'virtual' ? 'Virtual' : 'Presencial'}</span>`
    : '';

  const meetSection = data.meet_link
    ? `<p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Tu consulta es virtual. Ingresá al videollamada con el siguiente link:</p>
       <a href="${data.meet_link}" class="meet-btn">Unirse a la consulta por Google Meet</a>`
    : '';

  const html = `
    <!DOCTYPE html><html><head><style>${baseStyle()}</style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Turno confirmado ✓</h1>
          <p>e-bio-link — Tu turno está confirmado</p>
        </div>
        <div class="body">
          <p style="margin:0 0 20px;font-size:15px;color:#374151;">
            Hola <strong>${data.paciente_nombre}</strong>, tu turno fue confirmado exitosamente.
          </p>

          <div class="field">
            <div class="label">Profesional</div>
            <div class="value">${data.medico_nombre}${data.medico_especialidad ? ` · ${data.medico_especialidad}` : ''}</div>
          </div>

          <div class="field">
            <div class="label">Tipo de consulta</div>
            <div class="value">${data.evento_nombre || 'Consulta'} ${modalidadTag}</div>
          </div>

          <div class="field">
            <div class="label">Fecha y hora</div>
            <div class="value">${fecha}</div>
          </div>

          ${data.direccion ? `
          <div class="field">
            <div class="label">Dirección</div>
            <div class="value">📍 ${data.direccion}</div>
          </div>` : ''}

          ${data.monto ? `<div class="amount">${data.cobro_tipo === 'sena' ? 'Seña ' : ''}$${parseFloat(String(data.monto)).toLocaleString('es-AR')}</div>` : ''}
          ${data.cobro_tipo === 'sena' && data.precio_total ? `
          <p style="margin:-12px 0 16px;font-size:13px;color:#6b7280;text-align:center;">
            Resto a abonar en la consulta: $${parseFloat(String(data.precio_total)).toLocaleString('es-AR')}
          </p>` : ''}

          <hr class="divider" />

          ${meetSection}

          <p style="margin:16px 0 0;font-size:13px;color:#6b7280;">
            Si necesitás cancelar o reprogramar, comunicate con tu profesional con anticipación.
          </p>
        </div>
        <div class="footer">e-bio-link · Este es un correo automático, no respondas a este mensaje.</div>
      </div>
    </body></html>
  `;

  await resend.emails.send({
    from: FROM,
    to: data.paciente_email,
    reply_to: data.medico_email,
    subject: `Turno confirmado con ${data.medico_nombre} — ${new Date(data.fecha_hora).toLocaleDateString('es-AR')}`,
    html,
  });

  console.log(`[Email] Confirmación enviada a ${data.paciente_email}`);
}

// ── 2. Notificación al profesional ───────────────────────────────────────────

export async function sendNewBookingNotification(data: ProfesionalNotifData): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY no configurada — email no enviado');
    return;
  }

  const fecha = formatFecha(data.fecha_hora);

  const html = `
    <!DOCTYPE html><html><head><style>${baseStyle()}</style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Nuevo turno reservado</h1>
          <p>e-bio-link — Un paciente reservó un turno con vos</p>
        </div>
        <div class="body">
          <p style="margin:0 0 20px;font-size:15px;color:#374151;">
            Tenés un nuevo turno confirmado.
          </p>

          <div class="field">
            <div class="label">Paciente</div>
            <div class="value">${data.paciente_nombre}</div>
          </div>

          <div class="field">
            <div class="label">Email del paciente</div>
            <div class="value">${data.paciente_email}</div>
          </div>

          ${data.paciente_telefono ? `
          <div class="field">
            <div class="label">Teléfono</div>
            <div class="value">${data.paciente_telefono}</div>
          </div>` : ''}

          <div class="field">
            <div class="label">Tipo de consulta</div>
            <div class="value">${data.evento_nombre || 'Consulta'}</div>
          </div>

          <div class="field">
            <div class="label">Fecha y hora</div>
            <div class="value">${fecha}</div>
          </div>

          ${data.direccion ? `
          <div class="field">
            <div class="label">Dirección</div>
            <div class="value">📍 ${data.direccion}</div>
          </div>` : ''}

          ${data.monto ? `
          <div class="field">
            <div class="label">Monto cobrado</div>
            <div class="value" style="color:#16a34a;font-weight:700;">$${parseFloat(String(data.monto)).toLocaleString('es-AR')}</div>
          </div>` : ''}

          ${data.notas ? `
          <hr class="divider" />
          <div class="field">
            <div class="label">Notas del paciente</div>
            <div class="value" style="font-weight:400;font-size:14px;">${data.notas}</div>
          </div>` : ''}

          ${data.meet_link ? `
          <hr class="divider" />
          <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Link de Google Meet para la consulta:</p>
          <a href="${data.meet_link}" class="meet-btn">Abrir Google Meet</a>` : ''}
        </div>
        <div class="footer">e-bio-link · Este es un correo automático.</div>
      </div>
    </body></html>
  `;

  await resend.emails.send({
    from: FROM,
    to: data.medico_email,
    reply_to: data.paciente_email,
    subject: `Nuevo turno: ${data.paciente_nombre} — ${new Date(data.fecha_hora).toLocaleDateString('es-AR')}`,
    html,
  });

  console.log(`[Email] Notificación enviada al profesional ${data.medico_email}`);
}

// ── 3. Cancelación al paciente ────────────────────────────────────────────────

export async function sendBookingCancellation(data: BookingEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY no configurada — email no enviado');
    return;
  }

  const fecha = formatFecha(data.fecha_hora);

  const html = `
    <!DOCTYPE html><html><head><style>${baseStyle()}</style></head>
    <body>
      <div class="container">
        <div class="header" style="background:#dc2626;">
          <h1>Turno cancelado</h1>
          <p>e-bio-link — Tu turno fue cancelado</p>
        </div>
        <div class="body">
          <p style="margin:0 0 20px;font-size:15px;color:#374151;">
            Hola <strong>${data.paciente_nombre}</strong>, ${data.medico_nombre} no pudo confirmar tu turno del <strong>${fecha}</strong>.
            Esto puede deberse a que el pago no se acreditó o a un imprevisto de agenda.
          </p>

          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 18px;margin:16px 0;font-size:13px;color:#991b1b;">
            <strong>¿Hiciste una transferencia?</strong> El pago y cualquier devolución se coordinan directamente con ${data.medico_nombre}.
            e-bio-link no retiene ni gestiona los fondos — el dinero fue directo a la cuenta del profesional.
          </div>

          <hr class="divider" />

          <p style="margin:0;font-size:13px;color:#6b7280;">
            Respondé este correo o contactá directamente a ${data.medico_nombre} para reprogramar o coordinar la devolución.
          </p>
        </div>
        <div class="footer">e-bio-link · Sistema de turnos online.</div>
      </div>
    </body></html>
  `;

  await resend.emails.send({
    from: FROM,
    to: data.paciente_email,
    reply_to: data.medico_email,
    subject: `Sobre tu turno con ${data.medico_nombre} — necesitamos reprogramar`,
    html,
  });

  console.log(`[Email] Cancelación enviada a ${data.paciente_email}`);
}

// ── 4. Notificación al médico con comprobante + botones confirmar/rechazar ────

interface ComprobanteNotifData {
  medico_email: string;
  medico_nombre: string;
  paciente_nombre: string;
  paciente_email: string;
  paciente_telefono?: string;
  fecha_hora: string;
  evento_nombre: string;
  monto?: number | string;
  comprobante_url: string;
  confirm_url: string;
  reject_url: string;
  cobro_tipo?: 'total' | 'sena';
  precio_total?: number | string;
  direccion?: string | null;
}

export async function sendComprobanteNotification(data: ComprobanteNotifData): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY no configurada — email no enviado');
    return;
  }

  const fecha = formatFecha(data.fecha_hora);
  const comprobanteViewUrl = data.comprobante_url.toLowerCase().includes('.pdf')
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(data.comprobante_url)}`
    : data.comprobante_url;

  const html = `
    <!DOCTYPE html><html><head><style>${baseStyle()}
    .btn-confirm { display:inline-block; background:#16a34a; color:#ffffff !important; padding:14px 28px; border-radius:8px; font-weight:700; font-size:15px; text-decoration:none; margin:8px 4px; }
    .btn-reject  { display:inline-block; background:#dc2626; color:#ffffff !important; padding:14px 28px; border-radius:8px; font-weight:700; font-size:15px; text-decoration:none; margin:8px 4px; }
    .comprobante-link { display:inline-block; background:#f0f9ff; border:1px solid #0ea5e9; color:#0369a1; padding:10px 20px; border-radius:8px; font-size:13px; font-weight:600; text-decoration:none; margin:12px 0; }
    .aviso { background:#fefce8; border:1px solid #fde047; border-radius:8px; padding:14px 18px; margin:20px 0; font-size:13px; color:#713f12; }
    </style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Nuevo comprobante de pago</h1>
          <p>e-bio-link — Un paciente realizó la transferencia</p>
        </div>
        <div class="body">
          <p style="margin:0 0 20px;font-size:15px;color:#374151;">
            Hola <strong>${data.medico_nombre}</strong>, el paciente <strong>${data.paciente_nombre}</strong> subió el comprobante de pago de su turno.
          </p>

          <div class="field">
            <div class="label">Paciente</div>
            <div class="value">${data.paciente_nombre}</div>
          </div>

          <div class="field">
            <div class="label">Email</div>
            <div class="value">${data.paciente_email}</div>
          </div>

          ${data.paciente_telefono ? `
          <div class="field">
            <div class="label">Teléfono</div>
            <div class="value">${data.paciente_telefono}</div>
          </div>` : ''}

          <div class="field">
            <div class="label">Tipo de consulta</div>
            <div class="value">${data.evento_nombre}</div>
          </div>

          <div class="field">
            <div class="label">Fecha y hora</div>
            <div class="value">${fecha}</div>
          </div>

          ${data.direccion ? `
          <div class="field">
            <div class="label">Dirección</div>
            <div class="value">📍 ${data.direccion}</div>
          </div>` : ''}

          ${data.monto ? `<div class="amount">${data.cobro_tipo === 'sena' ? 'Seña ' : ''}$${parseFloat(String(data.monto)).toLocaleString('es-AR')}</div>` : ''}
          ${data.cobro_tipo === 'sena' && data.precio_total ? `
          <p style="margin:-12px 0 16px;font-size:13px;color:#6b7280;text-align:center;">
            Seña — saldo de $${parseFloat(String(data.precio_total)).toLocaleString('es-AR')} se abona en la consulta
          </p>` : ''}

          <hr class="divider" />

          <p style="margin:0 0 10px;font-size:14px;font-weight:600;color:#374151;">Comprobante de transferencia:</p>
          <a href="${comprobanteViewUrl}" class="comprobante-link" target="_blank">
            Ver comprobante →
          </a>

          <div class="aviso">
            <strong>Antes de confirmar:</strong> Verificá en tu cuenta bancaria que el monto haya ingresado correctamente.
          </div>

          <hr class="divider" />

          <p style="margin:0 0 16px;font-size:14px;color:#374151;text-align:center;">Una vez verificado el pago, usá los botones para confirmar o rechazar el turno:</p>

          <div style="text-align:center;">
            <a href="${data.confirm_url}" class="btn-confirm">Confirmar turno</a>
            <a href="${data.reject_url}" class="btn-reject">Rechazar turno</a>
          </div>

          <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;text-align:center;">
            Al confirmar, el paciente recibirá un email de confirmación automáticamente.
          </p>
        </div>
        <div class="footer">e-bio-link · Este es un correo automático.</div>
      </div>
    </body></html>
  `;

  await resend.emails.send({
    from: FROM,
    to: data.medico_email,
    reply_to: data.paciente_email,
    subject: `Nuevo comprobante: ${data.paciente_nombre} — ${new Date(data.fecha_hora).toLocaleDateString('es-AR')}`,
    html,
  });

  console.log(`[Email] Notificación de comprobante enviada a ${data.medico_email}`);
}

// ── 5. Reserva expirada (aviso al paciente) ───────────────────────────────────

interface ReservaExpiradaData {
  paciente_nombre: string;
  paciente_email: string;
  medico_nombre: string;
  medico_email?: string;
  fecha_hora: string; // ISO 8601
  slug: string;       // para el link al biolink
}

export async function sendReservaExpirada(data: ReservaExpiradaData): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY no configurada — email no enviado');
    return;
  }

  const cuando = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(data.fecha_hora));

  const biolink = `https://ebiolink.app/${data.slug}`;

  const html = `
    <!DOCTYPE html><html><head><style>${baseStyle()}
    .cta { display:inline-block; background:#4f46e5; color:#ffffff !important; padding:14px 28px; border-radius:8px; font-weight:700; font-size:15px; text-decoration:none; margin:20px 0; }
    .aviso { background:#fefce8; border:1px solid #fde047; border-radius:8px; padding:14px 18px; margin:20px 0; font-size:13px; color:#713f12; }
    </style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Tu reserva venció</h1>
          <p>e-bio-link — Podés reservar de nuevo</p>
        </div>
        <div class="body">
          <p style="margin:0 0 20px;font-size:15px;color:#374151;">
            Hola <strong>${data.paciente_nombre}</strong>, venció el plazo para completar el pago de tu turno del
            <strong>${cuando}</strong> con <strong>${data.medico_nombre}</strong>,
            así que liberamos ese horario.
          </p>

          <div class="aviso">
            <strong>Quedate tranquilo/a: no se cobró nada.</strong> El horario quedó libre para que vos u otro paciente lo pueda tomar.
          </div>

          <p style="font-size:15px;color:#374151;margin:0 0 8px;">
            Si todavía querés atenderte, podés reservar de nuevo — ese mismo horario u otro — acá:
          </p>

          <div style="text-align:center;">
            <a href="${biolink}" class="cta">Reservar de nuevo →</a>
          </div>

          <p style="margin:20px 0 0;font-size:13px;color:#6b7280;text-align:center;">
            Ante cualquier duda, respondé este correo.
          </p>
        </div>
        <div class="footer">e-bio-link · Este es un correo automático.</div>
      </div>
    </body></html>
  `;

  await resend.emails.send({
    from: FROM,
    to: data.paciente_email,
    reply_to: data.medico_email,
    subject: `Tu reserva con ${data.medico_nombre} venció — podés reservar de nuevo`,
    html,
  });

  console.log(`[Email] Aviso de expiración enviado a ${data.paciente_email}`);
}

// ── 6. Instrucciones de pago al paciente (al crear la reserva, solo transfer) ──

interface InstruccionesPagoData {
  paciente_nombre: string;
  paciente_email: string;
  medico_nombre: string;
  medico_email?: string;
  fecha_hora: string;
  evento_nombre: string;
  monto: number;
  cobro_tipo: 'total' | 'sena';
  precio_total?: number;
  cbu_alias?: string | null;
  banco_nombre?: string | null;
  titular_cuenta?: string | null;
  link_pago: string;          // /reserva/[slug]/pago?token=...
  ventana_minutos: number;    // payment_window_minutes del profesional
}

export async function sendInstruccionesPago(data: InstruccionesPagoData): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY no configurada — email no enviado');
    return;
  }

  const fecha = formatFecha(data.fecha_hora);
  const concepto = data.cobro_tipo === 'sena' ? 'la seña' : 'el pago del turno';

  const ventanaTexto = data.ventana_minutos >= 60
    ? `${data.ventana_minutos / 60} hora${data.ventana_minutos / 60 !== 1 ? 's' : ''}`
    : `${data.ventana_minutos} minutos`;

  const montoExtra = data.cobro_tipo === 'sena' && data.precio_total
    ? `<p style="margin:4px 0 0;font-size:12px;color:#6b7280;">Total de la consulta: $${data.precio_total.toLocaleString('es-AR')} · El saldo se abona el día del turno.</p>`
    : '';

  const datosBancarios = (data.cbu_alias || data.banco_nombre || data.titular_cuenta) ? `
    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:16px 20px;margin:20px 0;">
      <p style="margin:0 0 10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#0369a1;">Datos para la transferencia</p>
      ${data.cbu_alias ? `<p style="margin:0 0 6px;font-size:14px;color:#111827;"><strong>Alias / CBU:</strong> ${data.cbu_alias}</p>` : ''}
      ${data.titular_cuenta ? `<p style="margin:0 0 6px;font-size:14px;color:#111827;"><strong>Titular:</strong> ${data.titular_cuenta}</p>` : ''}
      ${data.banco_nombre ? `<p style="margin:0;font-size:14px;color:#111827;"><strong>Banco:</strong> ${data.banco_nombre}</p>` : ''}
    </div>
  ` : '';

  const html = `
    <!DOCTYPE html><html><head><style>${baseStyle()}
    .cta-block { display:block; background:#4f46e5; color:#ffffff !important; padding:16px 24px; border-radius:10px; font-weight:700; font-size:16px; text-decoration:none; text-align:center; margin:16px 0 8px; }
    .aviso { background:#fefce8; border:1px solid #fde047; border-radius:8px; padding:14px 18px; margin:20px 0; font-size:13px; color:#713f12; }
    </style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Turno reservado — completá el pago</h1>
          <p>e-bio-link · ${data.medico_nombre}</p>
        </div>
        <div class="body">
          <p style="margin:0 0 20px;font-size:15px;color:#374151;">
            Hola <strong>${data.paciente_nombre}</strong>, tu turno quedó reservado. Para confirmarlo seguí estos 2 pasos:
          </p>

          <div class="field">
            <div class="label">Profesional</div>
            <div class="value">${data.medico_nombre}</div>
          </div>
          <div class="field">
            <div class="label">Consulta</div>
            <div class="value">${data.evento_nombre}</div>
          </div>
          <div class="field">
            <div class="label">Fecha y hora</div>
            <div class="value">${fecha}</div>
          </div>

          <div class="amount">
            $${data.monto.toLocaleString('es-AR')}
            <div style="font-size:13px;font-weight:400;color:#15803d;margin-top:4px;">${data.cobro_tipo === 'sena' ? 'Seña' : 'Total'}</div>
          </div>
          ${montoExtra}

          <div class="aviso">
            <strong>Tenés ${ventanaTexto} para completar el pago.</strong> Pasado ese tiempo, el horario se libera para otros pacientes y tendrías que reservar de nuevo.
          </div>

          <!-- Paso 1 -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 12px;">
            <tr>
              <td width="32" valign="middle">
                <table cellpadding="0" cellspacing="0"><tr><td width="26" height="26" bgcolor="#4f46e5" style="border-radius:13px;text-align:center;vertical-align:middle;">
                  <span style="color:#fff;font-weight:700;font-size:13px;line-height:26px;">1</span>
                </td></tr></table>
              </td>
              <td valign="middle" style="font-size:15px;font-weight:700;color:#111827;padding-left:8px;">Transferí</td>
            </tr>
          </table>
          ${datosBancarios}

          <!-- Paso 2 -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 12px;">
            <tr>
              <td width="32" valign="middle">
                <table cellpadding="0" cellspacing="0"><tr><td width="26" height="26" bgcolor="#4f46e5" style="border-radius:13px;text-align:center;vertical-align:middle;">
                  <span style="color:#fff;font-weight:700;font-size:13px;line-height:26px;">2</span>
                </td></tr></table>
              </td>
              <td valign="middle" style="font-size:15px;font-weight:700;color:#111827;padding-left:8px;">Subí el comprobante</td>
            </tr>
          </table>
          <a href="${data.link_pago}" class="cta-block">Subir mi comprobante →</a>
          <p style="font-size:12px;color:#9ca3af;text-align:center;margin:4px 0 20px;">
            ¿El botón no funciona? <a href="${data.link_pago}" style="color:#9ca3af;">Hacé clic aquí</a>
          </p>

          <p style="margin:20px 0 0;font-size:13px;color:#6b7280;text-align:center;">
            Ante cualquier duda, respondé este correo.
          </p>
        </div>
        <div class="footer">e-bio-link · Sistema de turnos online.</div>
      </div>
    </body></html>
  `;

  await resend.emails.send({
    from: FROM,
    to: data.paciente_email,
    reply_to: data.medico_email,
    subject: `Turno reservado con ${data.medico_nombre} — completá el pago`,
    html,
  });

  console.log(`[Email] Instrucciones de pago enviadas a ${data.paciente_email}`);
}

// ── 7. Acuse de comprobante al paciente ───────────────────────────────────────

interface ComprobanteAcuseData {
  paciente_nombre: string;
  paciente_email: string;
  medico_nombre: string;
  medico_email?: string;
  fecha_hora: string;
  modalidad?: 'virtual' | 'presencial';
}

export async function sendComprobanteAcuse(data: ComprobanteAcuseData): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY no configurada — email no enviado');
    return;
  }

  const fecha = formatFecha(data.fecha_hora);
  const modalidadTexto = data.modalidad === 'presencial'
    ? 'la dirección del consultorio'
    : 'el link de videollamada';

  const html = `
    <!DOCTYPE html><html><head><style>${baseStyle()}
    .check { display:inline-block; background:#dcfce7; color:#16a34a; border-radius:50%; width:40px; height:40px; line-height:40px; text-align:center; font-size:20px; font-weight:700; margin-bottom:16px; }
    </style></head>
    <body>
      <div class="container">
        <div class="header" style="background:#16a34a;">
          <h1>Comprobante recibido ✓</h1>
          <p>e-bio-link · ${data.medico_nombre}</p>
        </div>
        <div class="body">
          <p style="margin:0 0 20px;font-size:15px;color:#374151;">
            Hola <strong>${data.paciente_nombre}</strong>, recibimos tu comprobante de pago.
          </p>

          <div class="field">
            <div class="label">Profesional</div>
            <div class="value">${data.medico_nombre}</div>
          </div>
          <div class="field">
            <div class="label">Turno</div>
            <div class="value">${fecha}</div>
          </div>

          <hr class="divider" />

          <p style="font-size:14px;color:#374151;margin:0 0 8px;">
            <strong>${data.medico_nombre}</strong> valida el pago y confirma tu turno. Cuando esté confirmado, te llega un mail con ${modalidadTexto}.
          </p>
          <p style="font-size:13px;color:#6b7280;margin:0;">
            Si surgiera algún inconveniente, ${data.medico_nombre} se comunica con vos para reprogramar.
          </p>
        </div>
        <div class="footer">e-bio-link · Sistema de turnos online.</div>
      </div>
    </body></html>
  `;

  await resend.emails.send({
    from: FROM,
    to: data.paciente_email,
    reply_to: data.medico_email,
    subject: `Comprobante recibido ✓ — Turno con ${data.medico_nombre}`,
    html,
  });

  console.log(`[Email] Acuse de comprobante enviado a ${data.paciente_email}`);
}
