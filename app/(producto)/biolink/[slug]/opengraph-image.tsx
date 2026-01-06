import { ImageResponse } from 'next/og';
import { getProfileBySlug } from '@/lib/get-profile';

// Route segment config
export const runtime = 'nodejs';

// Configuración de la imagen (Tamaño estándar Open Graph)
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// Generación de la imagen
export default async function Image({ params }: { params: { slug: string } }) {
  // 1. Buscamos los datos del médico
  const perfil = await getProfileBySlug(params.slug);

  if (!perfil) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: 'white',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          Perfil no encontrado
        </div>
      ),
      { ...size }
    );
  }

  // 2. Dibujamos la tarjeta con JSX
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #f8fafc, #e2e8f0)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Lado Izquierdo: Texto */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '60%',
            paddingLeft: 80,
            justifyContent: 'center',
          }}
        >
          {/* Badge de "Reserva tu Turno" */}
          <div
            style={{
              display: 'flex',
              background: '#2563EB',
              color: 'white',
              padding: '8px 24px',
              borderRadius: 50,
              fontSize: 24,
              fontWeight: 'bold',
              width: 'fit-content',
              marginBottom: 20,
            }}
          >
            📅 Reserva tu Turno
          </div>

          <div
            style={{
              fontSize: 64,
              fontWeight: 'bold',
              color: '#0F172A',
              lineHeight: 1.1,
              marginBottom: 10,
            }}
          >
            {perfil.nombre_completo}
          </div>

          <div style={{ fontSize: 36, color: '#475569', marginTop: 10 }}>
            {perfil.especialidad || 'Profesional de la Salud'}
          </div>

          {perfil.matricula && (
            <div style={{ fontSize: 28, color: '#64748B', marginTop: 10 }}>
              Mat. {perfil.matricula}
            </div>
          )}

          {/* Marca de agua */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: 60,
              opacity: 0.6,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                background: '#2563EB',
                borderRadius: '50%',
                marginRight: 10,
              }}
            ></div>
            <div style={{ fontSize: 24, color: '#64748B' }}>e-bio-link</div>
          </div>
        </div>

        {/* Lado Derecho: Foto */}
        <div
          style={{
            display: 'flex',
            width: '40%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#eff6ff',
          }}
        >
          {/* Círculo decorativo detrás */}
          <div
            style={{
              position: 'absolute',
              width: 400,
              height: 400,
              background: '#dbeafe',
              borderRadius: '50%',
            }}
          ></div>

          {/* Foto del médico - Solo mostrar si tiene URL */}
          {perfil.foto_url && perfil.foto_url !== '' ? (
            <img
              src={perfil.foto_url}
              alt={perfil.nombre_completo}
              width="320"
              height="320"
              style={{
                borderRadius: '50%',
                objectFit: 'cover',
                border: '8px solid white',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              }}
            />
          ) : (
            // Placeholder si no hay foto
            <div
              style={{
                display: 'flex',
                width: 320,
                height: 320,
                borderRadius: '50%',
                background: 'white',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 120,
                border: '8px solid white',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              }}
            >
              👨‍⚕️
            </div>
          )}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
