'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Client {
  id: string;
  slug: string;
  email: string;
  nombre_completo: string;
  especialidad: string;
  status: string;
  created_at: string;
  mp_user_id: string;
  google_email: string;
}

export default function ClientesPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    slug: '',
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/clients');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/admin/login');
          return;
        }
        throw new Error('Error al cargar clientes');
      }
      const data = await response.json();
      setClients(data.clients);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al crear cliente');

      setSuccess(`Cliente creado. Puede iniciar sesión en ebiolink.app/login`);
      setShowForm(false);
      setFormData({ email: '', password: '', slug: '' });
      loadClients();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm(`¿Eliminar el cliente /${slug}? Esta acción no se puede deshacer.`)) return;

    try {
      const response = await fetch(`/api/admin/clients/${slug}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar cliente');
      }
      setSuccess('Cliente eliminado');
      loadClients();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
            <p className="text-gray-500 text-sm mt-1">Gestión de clientes · e-bio-link</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-800 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-green-800 text-sm">
            {success}
          </div>
        )}

        {/* New client button */}
        <div className="mb-6">
          <button
            onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            {showForm ? 'Cancelar' : '+ Nuevo cliente'}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Crear nuevo cliente</h2>
            <form onSubmit={handleSubmit} className="space-y-5 max-w-md">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="medico@gmail.com"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">El cliente puede cambiarla después desde su panel.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL del biolink) *</label>
                <div className="flex items-center">
                  <span className="px-3 py-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500 text-sm">
                    ebiolink.app/
                  </span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                    placeholder="dra-maria-garcia"
                    required
                    pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                    minLength={3}
                    maxLength={50}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Solo letras minúsculas, números y guiones.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Crear cliente
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setFormData({ email: '', password: '', slug: '' }); }}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Clients list */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Clientes ({clients.length})</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Cargando...</div>
          ) : clients.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No hay clientes aún.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email / Slug</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Google</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">MP</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{client.email}</div>
                        <a
                          href={`/${client.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          /{client.slug} →
                        </a>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {client.nombre_completo || <span className="text-gray-400 italic">Sin completar</span>}
                        {client.especialidad && <div className="text-xs text-gray-400">{client.especialidad}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          client.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {client.status === 'active' ? 'Activo' : client.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {client.google_email
                          ? <span className="text-green-600 text-xs">{client.google_email}</span>
                          : <span className="text-gray-400 text-xs">—</span>}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {client.mp_user_id
                          ? <span className="text-green-600 text-xs">Conectado</span>
                          : <span className="text-gray-400 text-xs">—</span>}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {new Date(client.created_at).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDelete(client.slug)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
