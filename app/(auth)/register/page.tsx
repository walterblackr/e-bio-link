"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Lock, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const PLAN_INFO = {
  monthly:   { name: 'Plan Mensual',   price: 19990,  period: 'mes',     badge: 'Pruébalo' },
  semestral: { name: 'Plan Semestral', price: 80000,  period: '6 meses', badge: 'Ahorro' },
  annual:    { name: 'Plan Anual',     price: 120000, period: '12 meses', badge: 'Recomendado' },
};

function RegisterForm() {
  const searchParams = useSearchParams();
  const plan = (searchParams.get('plan') || 'monthly') as keyof typeof PLAN_INFO;
  const planInfo = PLAN_INFO[plan];

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    slug: '',
  });

  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [slugMessage, setSlugMessage] = useState('');
  const [error, setError] = useState('');
  const [pendingClientId, setPendingClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Verificar disponibilidad del slug con debounce
  useEffect(() => {
    if (!formData.slug || formData.slug.length < 3) {
      setSlugStatus('idle');
      setSlugMessage('');
      return;
    }

    const timer = setTimeout(async () => {
      setSlugStatus('checking');
      try {
        const res = await fetch(`/api/check-slug-availability?slug=${formData.slug}`);
        const data = await res.json();
        if (data.available) {
          setSlugStatus('available');
          setSlugMessage('Disponible');
        } else {
          setSlugStatus('unavailable');
          setSlugMessage(data.message || 'No disponible');
        }
      } catch {
        setSlugStatus('idle');
        setSlugMessage('');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (slugStatus !== 'available') {
      setError('Por favor elegí una URL disponible');
      return;
    }

    setLoading(true);
    setPendingClientId(null);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          slug: formData.slug,
          plan,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.check_payment && data.client_id) {
          setPendingClientId(data.client_id);
        }
        throw new Error(data.error || 'Error al registrarse');
      }

      window.location.href = data.init_point;
    } catch (err: any) {
      setError(err.message || 'Error al procesar el registro');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>

      {/* Logo */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '15px', fontWeight: 600, color: '#4b5563', letterSpacing: '-0.01em' }}>e-bio-link</span>
      </div>

      {/* Pasos */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>1</div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#4f46e5' }}>Crear cuenta</span>
        </div>
        <div style={{ width: '32px', height: '2px', background: '#e2e8f0' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e2e8f0', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>2</div>
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8' }}>Pagar</span>
        </div>
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: '440px', background: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden' }}>

        {/* Plan seleccionado */}
        <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: '#c7d2fe', fontSize: '12px', fontWeight: 500, marginBottom: '2px' }}>Plan seleccionado</p>
            <p style={{ color: '#ffffff', fontSize: '18px', fontWeight: 700 }}>{planInfo.name}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: '#ffffff', fontSize: '24px', fontWeight: 800 }}>
              ${planInfo.price.toLocaleString('es-AR')}
            </p>
            <p style={{ color: '#c7d2fe', fontSize: '12px' }}>/ {planInfo.period}</p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Email */}
          <div>
            <label htmlFor="email" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="tu@email.com"
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
              onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '4px' }}>
              Tu URL personalizada
            </label>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
              Dirección de tu página pública. Ej: <strong style={{ color: '#4b5563' }}>ebiolink.com/dra-garcia</strong>
            </p>
            <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #d1d5db', borderRadius: '8px', overflow: 'hidden', background: '#fff', transition: 'border-color 0.15s' }}
              onFocusCapture={(e) => (e.currentTarget.style.borderColor = '#4f46e5')}
              onBlurCapture={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
            >
              <span style={{ padding: '10px 10px 10px 14px', fontSize: '13px', color: '#9ca3af', whiteSpace: 'nowrap', borderRight: '1px solid #e5e7eb', background: '#f9fafb' }}>
                ebiolink.com/
              </span>
              <input
                id="slug"
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                placeholder="tu-nombre"
                minLength={3}
                maxLength={50}
                style={{ flex: 1, padding: '10px 14px', fontSize: '14px', color: '#111827', background: 'transparent', border: 'none', outline: 'none' }}
              />
              {slugStatus === 'checking' && <Loader2 style={{ width: '16px', height: '16px', color: '#9ca3af', marginRight: '12px', flexShrink: 0 }} className="animate-spin" />}
              {slugStatus === 'available' && <CheckCircle style={{ width: '16px', height: '16px', color: '#16a34a', marginRight: '12px', flexShrink: 0 }} />}
              {slugStatus === 'unavailable' && <XCircle style={{ width: '16px', height: '16px', color: '#dc2626', marginRight: '12px', flexShrink: 0 }} />}
            </div>
            {slugStatus === 'available' && (
              <p style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px' }}>✓ {slugMessage}</p>
            )}
            {slugStatus === 'unavailable' && (
              <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>✗ {slugMessage}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
              onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Repetí tu contraseña"
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
              onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px' }}>
              {error}
              {pendingClientId && (
                <div style={{ marginTop: '8px' }}>
                  <a
                    href={`/success?client_id=${pendingClientId}`}
                    style={{ color: '#dc2626', fontWeight: 700, textDecoration: 'underline' }}
                  >
                    Ver estado de tu pago →
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || slugStatus !== 'available'}
            style={{
              width: '100%',
              padding: '12px',
              background: loading || slugStatus !== 'available' ? '#9ca3af' : '#4f46e5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: loading || slugStatus !== 'available' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background 0.15s',
            }}
          >
            {loading ? (
              <>
                <Loader2 style={{ width: '18px', height: '18px' }} className="animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                Continuar al Pago
                <ArrowRight style={{ width: '18px', height: '18px' }} />
              </>
            )}
          </button>

          {/* Seguridad */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', paddingTop: '4px' }}>
            <Lock style={{ width: '13px', height: '13px', color: '#9ca3af' }} />
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Pago seguro procesado por Mercado Pago</span>
          </div>
        </form>
      </div>

      {/* Volver */}
      <div style={{ marginTop: '20px' }}>
        <Link
          href="/propuesta"
          style={{ fontSize: '13px', color: '#6366f1', textDecoration: 'none' }}
        >
          ← Volver a elegir plan
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 style={{ width: '32px', height: '32px', color: '#4f46e5' }} className="animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
