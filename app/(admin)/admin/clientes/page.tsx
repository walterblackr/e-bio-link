'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Client {
  slug: string;
  nombre_completo: string;
  especialidad: string;
  matricula: string;
  descripcion: string;
  foto_url: string;
  cal_api_key: string;
  cal_username: string;
  mp_user_id: string;
  created_at: string;
  botones_config: any;
  tema_config: any;
  monto_consulta: number;
}

export default function ClientesPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    slug: '',
    nombre_completo: '',
    especialidad: '',
    matricula: '',
    descripcion: '',
    foto_url: '',
    cal_api_key: '',
    cal_username: '',
    botones_config: '[]',
    tema_config: '{}',
    monto_consulta: '10000',
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
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const url = editingClient
        ? `/api/admin/clients/${editingClient.slug}`
        : '/api/admin/clients';

      const method = editingClient ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar cliente');
      }

      setSuccess(editingClient ? 'Cliente actualizado exitosamente' : 'Cliente creado exitosamente');
      setShowForm(false);
      setEditingClient(null);
      resetForm();
      loadClients();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      slug: client.slug,
      nombre_completo: client.nombre_completo,
      especialidad: client.especialidad,
      matricula: client.matricula,
      descripcion: client.descripcion,
      foto_url: client.foto_url,
      cal_api_key: client.cal_api_key,
      cal_username: client.cal_username,
      botones_config: typeof client.botones_config === 'string'
        ? client.botones_config
        : JSON.stringify(client.botones_config, null, 2),
      tema_config: typeof client.tema_config === 'string'
        ? client.tema_config
        : JSON.stringify(client.tema_config, null, 2),
      monto_consulta: client.monto_consulta?.toString() || '10000',
    });
    setShowForm(true);
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/clients/${slug}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar cliente');
      }

      setSuccess('Cliente eliminado exitosamente');
      loadClients();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      slug: '',
      nombre_completo: '',
      especialidad: '',
      matricula: '',
      descripcion: '',
      foto_url: '',
      cal_api_key: '',
      cal_username: '',
      botones_config: '[]',
      tema_config: '{}',
      monto_consulta: '10000',
    });
    setEditingClient(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                👥 Gestión de Clientes
              </h1>
              <p className="text-gray-600">
                Administrá todos los clientes y sus biolinks
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/generate-links"
                className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-colors"
              >
                🔗 Generar Links OAuth
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">❌ {error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 text-sm">✅ {success}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mb-6">
          <button
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) {
                resetForm();
              }
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
          >
            {showForm ? '❌ Cancelar' : '➕ Nuevo Cliente'}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingClient ? '✏️ Editar Cliente' : '➕ Nuevo Cliente'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Slug (solo para nuevo) */}
              {!editingClient && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug (URL) *
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                    placeholder="dr-juan-perez"
                    required
                    pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Solo letras minúsculas, números y guiones. Ej: dr-juan-perez
                  </p>
                </div>
              )}

              {/* Nombre Completo */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={formData.nombre_completo}
                  onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                  placeholder="Dr. Juan Pérez"
                  required
                  maxLength={255}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                />
              </div>

              {/* Especialidad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Especialidad *
                </label>
                <input
                  type="text"
                  value={formData.especialidad}
                  onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                  placeholder="Cardiología"
                  required
                  maxLength={255}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                />
              </div>

              {/* Matrícula */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Matrícula *
                </label>
                <input
                  type="text"
                  value={formData.matricula}
                  onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                  placeholder="MN 12345 / MP 67890"
                  required
                  maxLength={100}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                />
              </div>

              {/* Descripción */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción / Bio
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Médico especialista en cardiología con 15 años de experiencia..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Descripción opcional que aparecerá en el biolink
                </p>
              </div>

              {/* Foto URL */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de Foto de Perfil
                </label>
                <input
                  type="url"
                  value={formData.foto_url}
                  onChange={(e) => setFormData({ ...formData, foto_url: e.target.value })}
                  placeholder="https://ejemplo.com/foto.jpg"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL completa de la imagen (opcional)
                </p>
              </div>

              {/* Cal.com API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cal.com API Key
                </label>
                <input
                  type="text"
                  value={formData.cal_api_key}
                  onChange={(e) => setFormData({ ...formData, cal_api_key: e.target.value })}
                  placeholder="cal_live_xxxxxxxxxxxxx"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                />
              </div>

              {/* Cal.com Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cal.com Username
                </label>
                <input
                  type="text"
                  value={formData.cal_username}
                  onChange={(e) => setFormData({ ...formData, cal_username: e.target.value })}
                  placeholder="dr-juan-perez"
                  maxLength={255}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                />
              </div>

              {/* Monto de Consulta */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto de Consulta (ARS)
                </label>
                <input
                  type="number"
                  value={formData.monto_consulta}
                  onChange={(e) => setFormData({ ...formData, monto_consulta: e.target.value })}
                  placeholder="10000"
                  min="0"
                  step="100"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Precio que se cobrará por cada consulta. Ejemplo: $10,000 ARS
                </p>
              </div>

              {/* Configuración de Botones (JSON) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Configuración de Botones (JSON)
                </label>
                <textarea
                  value={formData.botones_config}
                  onChange={(e) => setFormData({ ...formData, botones_config: e.target.value })}
                  placeholder='[{"id":"btn_1","texto":"Agendar Consulta","accion":"cal_modal","activo":true}]'
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  JSON válido. Ejemplo: {`[{"id":"btn_1","texto":"Agendar Consulta","accion":"cal_modal","activo":true}]`}
                </p>
                <details className="mt-2">
                  <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                    📖 Ver estructura completa
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
{`[
  {
    "id": "btn_1",
    "texto": "Agendar Consulta",
    "accion": "cal_modal",
    "activo": true
  },
  {
    "id": "btn_2",
    "url": "https://instagram.com",
    "texto": "Ver Instagram",
    "accion": "link",
    "activo": true
  }
]`}
                  </pre>
                </details>
              </div>

              {/* Configuración de Tema (JSON) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Configuración de Tema (JSON)
                </label>
                <textarea
                  value={formData.tema_config}
                  onChange={(e) => setFormData({ ...formData, tema_config: e.target.value })}
                  placeholder='{"borde":"rounded-lg","modoOscuro":false,"colorPrimario":"#3b82f6"}'
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  JSON válido. Ejemplo: {`{"borde":"rounded-lg","modoOscuro":false,"colorPrimario":"#3b82f6"}`}
                </p>
                <details className="mt-2">
                  <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                    📖 Ver opciones disponibles
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
{`{
  "borde": "rounded-lg",        // rounded-none, rounded-md, rounded-lg, rounded-xl
  "modoOscuro": false,          // true o false
  "colorPrimario": "#3b82f6"    // Color hexadecimal
}`}
                  </pre>
                </details>
              </div>

              {/* Buttons */}
              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  {editingClient ? '💾 Actualizar Cliente' : '➕ Crear Cliente'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Clients List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Clientes Registrados ({clients.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Cargando clientes...
            </div>
          ) : clients.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No hay clientes registrados. Creá el primero usando el botón "Nuevo Cliente".
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre / Slug
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Especialidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Matrícula
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mercado Pago
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clients.map((client) => (
                    <tr key={client.slug} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">
                            {client.nombre_completo}
                          </div>
                          <div className="text-sm text-gray-500">
                            /{client.slug}
                          </div>
                          <a
                            href={`/biolink/${client.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Ver biolink →
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {client.especialidad || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {client.matricula || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {client.mp_user_id ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            ✓ Conectado
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            ⚠ Sin conectar
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(client)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDelete(client.slug)}
                          className="text-red-600 hover:text-red-900"
                        >
                          🗑️ Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Información</h3>
          <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
            <li>Los campos marcados con * son obligatorios</li>
            <li>El <strong>slug</strong> es la URL del biolink (ej: /biolink/dr-juan-perez)</li>
            <li>Los tokens de Mercado Pago se conectan mediante el botón "Generar Links OAuth"</li>
            <li>Para que un cliente pueda recibir pagos, debe tener Mercado Pago conectado</li>
            <li>Los campos de Cal.com son opcionales y se usan para integrar agendas</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
