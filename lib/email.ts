// Envío de emails transaccionales con Resend
import { Resend } from 'resend';
import { parseArgentinaDate } from './date-utils';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'ebiolinkarg@gmail.com';

// ── Tipos ────────────────────────────────────────────────────────────────────

interface BookingEmailData {
  paciente_nombre: string;
  paciente_email: string;
  medico_nombre: string;
  medico_especialidad?: string;
  fecha_hora: string; // ISO 8601
  evento_nombre?: string;
  modalidad?: 'virtual' | 'presencial';
  meet_link?: string | null;
  monto?: number | string;
  booking_id?: number | string;
}

interface ProfesionalNotifData extends BookingEmailData {
  medico_email: string;
  paciente_telefono?: string;
  notas?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFecha(iso: string): string {
  return parseArgentinaDate(iso).toLocaleString('es-AR', {
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
          <p>e-bio-link — Tu turno está reservado</p>
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

          ${data.monto ? `<div class="amount">$${parseFloat(String(data.monto)).toLocaleString('es-AR')}</div>` : ''}

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
            Hola <strong>${data.paciente_nombre}</strong>, tu turno fue cancelado.
          </p>

          <div class="field">
            <div class="label">Profesional</div>
            <div class="value">${data.medico_nombre}</div>
          </div>

          <div class="field">
            <div class="label">Fecha y hora (cancelado)</div>
            <div class="value" style="text-decoration:line-through;color:#9ca3af;">${fecha}</div>
          </div>

          <hr class="divider" />

          <p style="margin:0;font-size:13px;color:#6b7280;">
            Si tenés alguna consulta, comunicate directamente con tu profesional.
          </p>
        </div>
        <div class="footer">e-bio-link · Este es un correo automático, no respondas a este mensaje.</div>
      </div>
    </body></html>
  `;

  await resend.emails.send({
    from: FROM,
    to: data.paciente_email,
    subject: `Turno cancelado — ${data.medico_nombre}`,
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
}

export async function sendComprobanteNotification(data: ComprobanteNotifData): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY no configurada — email no enviado');
    return;
  }

  const fecha = formatFecha(data.fecha_hora);

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

          ${data.monto ? `<div class="amount">$${parseFloat(String(data.monto)).toLocaleString('es-AR')}</div>` : ''}

          <hr class="divider" />

          <p style="margin:0 0 10px;font-size:14px;font-weight:600;color:#374151;">Comprobante de transferencia:</p>
          <a href="${data.comprobante_url}" class="comprobante-link" target="_blank">
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
    subject: `Nuevo comprobante: ${data.paciente_nombre} — ${new Date(data.fecha_hora).toLocaleDateString('es-AR')}`,
    html,
  });

  console.log(`[Email] Notificación de comprobante enviada a ${data.medico_email}`);
}
