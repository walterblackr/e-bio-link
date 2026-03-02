"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  User, Calendar, CreditCard, ExternalLink, LogOut,
  CheckCircle, XCircle, Clock, FileText, Phone, Mail,
  Loader2, AlertCircle, Eye
} from 'lucide-react';

interface Client {
  id: string;
  email: string;
  slug: string;
  nombre_completo: string;
  status: string;
  subscription_type: string | null;
}

interface Booking {
  id: string;
  paciente_nombre: string;
  paciente_email: string;
  paciente_telefono: string | null;
  fecha_hora: string;
  monto: number | null;
  estado: string;
  payment_method: string | null;
  comprobante_url: string | null;
  notas: string | null;
  meet_link: string | null;
  evento_nombre: string | null;
  modalidad: string | null;
}

type TabFilter = 'todos' | 'pendientes' | 'confirmados' | 'cancelados';

const ESTADO_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending_payment:     { label: 'Esperando comprobante', color: '#92400e', bg: '#fef3c7' },
  pending_confirmation:{ label: 'Por confirmar',         color: '#1e40af', bg: '#dbeafe' },
  pending:             { label: 'Pendiente',              color: '#6b7280', bg: '#f3f4f6' },
  confirmed:           { label: 'Confirmado',             color: '#065f46', bg: '#d1fae5' },
  cancelled:           { label: 'Cancelado',              color: '#991b1b', bg: '#fee2e2' },
  paid:                { label: 'Pagado (MP)',             color: '#065f46', bg: '#d1fae5' },
};

const PLAN_LABELS: Record<string, string> = {
  monthly:   'Plan Mensual',
  semestral: 'Plan Semestral',
  annual:    'Plan Anual',
};

function formatFecha(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatMonto(monto: number | null) {
  if (!monto) return '-';
  return `$${monto.toLocaleString('es-AR')}`;
}

export default function PanelClient({ client }: { client: Client }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [tab, setTab] = useState<TabFilter>('todos');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ id: string; msg: string; ok: boolean } | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch('/api/mis-turnos');
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error('Error cargando turnos:', err);
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleAction = async (bookingId: string, action: 'confirm' | 'reject') => {
    setActionLoading(bookingId + action);
    setActionMsg(null);
    try {
      const res = await fetch('/api/confirmar-turno', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMsg({ id: bookingId, msg: action === 'confirm' ? 'Turno confirmado' : 'Turno rechazado', ok: true });
        fetchBookings();
      } else {
        setActionMsg({ id: bookingId, msg: data.error || 'Error', ok: false });
      }
    } catch {
      setActionMsg({ id: bookingId, msg: 'Error de conexión', ok: false });
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/client-logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const filteredBookings = bookings.filter((b) => {
    if (tab === 'pendientes') return ['pending_payment', 'pending_confirmation', 'pending'].includes(b.estado);
    if (tab === 'confirmados') return ['confirmed', 'paid'].includes(b.estado);
    if (tab === 'cancelados') return b.estado === 'cancelled';
    return true;
  });

  const pendientesCount = bookings.filter(b => b.estado === 'pending_confirmation').length;

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'Arial, Helvetica, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#4f46e5' }}>e-bio-link</span>
            <span style={{ color: '#d1d5db' }}>|</span>
            <span style={{ fontSize: '14px', color: '#374151', fontWeight: 600 }}>
              {client.nombre_completo || client.email}
            </span>
            {client.subscription_type && (
              <span style={{ fontSize: '11px', fontWeight: 700, background: '#ede9fe', color: '#5b21b6', borderRadius: '20px', padding: '2px 10px' }}>
                {PLAN_LABELS[client.subscription_type] || client.subscription_type}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a
              href={`/biolink/${client.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#4f46e5', textDecoration: 'none', fontWeight: 500 }}
            >
              <ExternalLink size={14} /> Ver mi página
            </a>
            <button
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
            >
              <LogOut size={14} /> Salir
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Biolink URL */}
        <div style={{ background: '#ede9fe', borderRadius: '10px', padding: '12px 16px', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: '#5b21b6', fontWeight: 600 }}>Tu página pública:</span>
          <a
            href={`/biolink/${client.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '13px', color: '#4f46e5', fontWeight: 700, textDecoration: 'none' }}
          >
            ebiolink.com/{client.slug}
          </a>
        </div>

        {/* Sección: Configuración */}
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>
          Tu configuración
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '36px' }}>

          <Link
            href="/onboarding?step=1&from=panel"
            style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1.5px solid #e2e8f0', textDecoration: 'none', display: 'flex', alignItems: 'flex-start', gap: '14px', transition: 'border-color 0.15s' }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User size={20} color="#7c3aed" />
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: 0 }}>Perfil e imagen</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>Nombre, foto, bio y colores</p>
            </div>
          </Link>

          <Link
            href="/onboarding?step=3&from=panel"
            style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1.5px solid #e2e8f0', textDecoration: 'none', display: 'flex', alignItems: 'flex-start', gap: '14px' }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Calendar size={20} color="#2563eb" />
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: 0 }}>Consultas y horarios</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>Tipos de consulta y disponibilidad</p>
            </div>
          </Link>

          <Link
            href="/onboarding?step=4&from=panel"
            style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1.5px solid #e2e8f0', textDecoration: 'none', display: 'flex', alignItems: 'flex-start', gap: '14px' }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CreditCard size={20} color="#059669" />
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: 0 }}>Método de cobro</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>Mercado Pago o transferencia</p>
            </div>
          </Link>
        </div>

        {/* Sección: Turnos */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>
            Turnos recientes
            {pendientesCount > 0 && (
              <span style={{ marginLeft: '10px', fontSize: '12px', fontWeight: 700, background: '#fef3c7', color: '#92400e', borderRadius: '20px', padding: '2px 10px' }}>
                {pendientesCount} por confirmar
              </span>
            )}
          </h2>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: '#f1f5f9', borderRadius: '8px', padding: '4px', width: 'fit-content' }}>
          {(['todos', 'pendientes', 'confirmados', 'cancelados'] as TabFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: tab === t ? 700 : 500,
                color: tab === t ? '#4f46e5' : '#6b7280',
                background: tab === t ? '#fff' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                textTransform: 'capitalize',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tabla */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {loadingBookings ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', gap: '10px', color: '#9ca3af' }}>
              <Loader2 size={20} className="animate-spin" />
              <span style={{ fontSize: '14px' }}>Cargando turnos...</span>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px', color: '#9ca3af' }}>
              <Calendar size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
              <p style={{ fontSize: '14px', fontWeight: 500 }}>No hay turnos {tab !== 'todos' ? `${tab}` : ''}.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {['Fecha y hora', 'Tipo', 'Paciente', 'Contacto', 'Monto', 'Estado', 'Acciones'].map((h) => (
                      <th key={h} style={{ padding: '10px 16px', fontSize: '12px', fontWeight: 700, color: '#6b7280', textAlign: 'left', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b, i) => {
                    const estado = ESTADO_LABELS[b.estado] || { label: b.estado, color: '#6b7280', bg: '#f3f4f6' };
                    const isLast = i === filteredBookings.length - 1;
                    return (
                      <tr key={b.id} style={{ borderBottom: isLast ? 'none' : '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 600 }}>{formatFecha(b.fecha_hora)}</div>
                          {b.modalidad && (
                            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                              {b.modalidad === 'virtual' ? '📹 Virtual' : '🏥 Presencial'}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#374151' }}>
                          {b.evento_nombre || '—'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{b.paciente_nombre}</div>
                          {b.notas && (
                            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {b.notas}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <a href={`mailto:${b.paciente_email}`} style={{ fontSize: '12px', color: '#4f46e5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Mail size={11} /> {b.paciente_email}
                            </a>
                            {b.paciente_telefono && (
                              <a href={`https://wa.me/${b.paciente_telefono.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#059669', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Phone size={11} /> {b.paciente_telefono}
                              </a>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>
                          {formatMonto(b.monto)}
                          {b.payment_method === 'transfer' && (
                            <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 400 }}>Transferencia</div>
                          )}
                          {b.payment_method === 'mp' && (
                            <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 400 }}>Mercado Pago</div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: estado.color, background: estado.bg, borderRadius: '20px', padding: '2px 8px', whiteSpace: 'nowrap', width: 'fit-content' }}>
                              {estado.label}
                            </span>
                            {b.comprobante_url && (
                              <a
                                href={b.comprobante_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: '11px', color: '#4f46e5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                              >
                                <Eye size={11} /> Ver comprobante
                              </a>
                            )}
                            {b.meet_link && (
                              <a
                                href={b.meet_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontSize: '11px', color: '#059669', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                              >
                                <ExternalLink size={11} /> Google Meet
                              </a>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {b.estado === 'pending_confirmation' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {actionMsg?.id === b.id ? (
                                <div style={{ fontSize: '12px', fontWeight: 600, color: actionMsg.ok ? '#065f46' : '#991b1b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  {actionMsg.ok ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                                  {actionMsg.msg}
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleAction(b.id, 'confirm')}
                                    disabled={actionLoading !== null}
                                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', fontSize: '12px', fontWeight: 700, background: '#d1fae5', color: '#065f46', border: 'none', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                  >
                                    {actionLoading === b.id + 'confirm' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                    Confirmar
                                  </button>
                                  <button
                                    onClick={() => handleAction(b.id, 'reject')}
                                    disabled={actionLoading !== null}
                                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', fontSize: '12px', fontWeight: 700, background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                  >
                                    {actionLoading === b.id + 'reject' ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                                    Rechazar
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '12px', textAlign: 'center' }}>
          Mostrando los últimos 50 turnos
        </p>
      </div>
    </div>
  );
}
