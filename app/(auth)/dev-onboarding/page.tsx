"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DevOnboardingAccess() {
  const router = useRouter();
  const [email, setEmail] = useState("test@example.com");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/dev/create-test-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al crear sesión");
      }

      // Redirigir al onboarding
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.message || "Error al crear sesión de prueba");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            🧪 Acceso de Desarrollo
          </h1>
          <p className="text-sm text-gray-600">
            Crear sesión de prueba para acceder al onboarding
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-xs text-yellow-800">
            ⚠️ <strong>Solo para desarrollo</strong>
            <br />
            Este endpoint debe eliminarse en producción
          </p>
        </div>

        <form onSubmit={handleCreateSession} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email de prueba
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Se creará o activará un cliente con este email
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {loading ? "Creando sesión..." : "Acceder al Onboarding"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Esto creará un cliente activo y te llevará directamente al onboarding
          </p>
        </div>
      </div>
    </div>
  );
}
