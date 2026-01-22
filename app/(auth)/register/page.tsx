"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const PLAN_INFO = {
  monthly: { name: 'Mensual', price: 50, period: 'mes' },
  semestral: { name: 'Semestral', price: 50, period: '6 meses' },
  annual: { name: 'Anual', price: 50, period: '12 meses' },
};

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const plan = (searchParams.get('plan') || 'monthly') as keyof typeof PLAN_INFO;

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    slug: '',
  });

  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');
  const [slugMessage, setSlugMessage] = useState('');
  const [error, setError] = useState('');
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
          setSlugMessage('✓ Disponible');
        } else {
          setSlugStatus('unavailable');
          setSlugMessage(data.message || 'No disponible');
        }
      } catch (err) {
        setSlugStatus('idle');
        setSlugMessage('');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (slugStatus !== 'available') {
      setError('Por favor elige un slug disponible');
      return;
    }

    setLoading(true);

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
        throw new Error(data.error || 'Error al registrarse');
      }

      // Redirigir a Mercado Pago
      window.location.href = data.init_point;
    } catch (err: any) {
      setError(err.message || 'Error al procesar el registro');
      setLoading(false);
    }
  };

  const planInfo = PLAN_INFO[plan];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Crear Cuenta
          </h1>
          <p className="text-gray-600">
            Plan seleccionado: <span className="font-semibold text-indigo-600">{planInfo.name}</span>
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            ${planInfo.price.toLocaleString('es-AR')}
            <span className="text-sm font-normal text-gray-600"> / {planInfo.period}</span>
          </p>
        </div>

        {/* Form */}
        <div className="bg-white shadow-xl rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="tu@email.com"
              />
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                Tu URL personalizada
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">ebiolink.com/</span>
                <input
                  id="slug"
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                  placeholder="tu-nombre"
                  minLength={3}
                  maxLength={50}
                />
              </div>
              {slugStatus === 'checking' && (
                <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                  <Loader2 className="w-4 h-4 animate-spin" /> Verificando...
                </p>
              )}
              {slugStatus === 'available' && (
                <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> {slugMessage}
                </p>
              )}
              {slugStatus === 'unavailable' && (
                <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                  <XCircle className="w-4 h-4" /> {slugMessage}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="Repite tu contraseña"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || slugStatus !== 'available'}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Continuar al Pago'
              )}
            </button>
          </form>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <a
              href="/propuesta"
              className="text-sm text-indigo-600 hover:text-indigo-800 transition"
            >
              ← Volver a elegir plan
            </a>
          </div>
        </div>

        {/* Security Note */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Pago seguro procesado por Mercado Pago</p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
