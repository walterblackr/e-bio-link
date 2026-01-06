import { ImageResponse } from '@vercel/og';
import type { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = req.url.split('/').pop();

    if (!slug) {
      return new Response('Slug not provided', { status: 400 });
    }

    // Fetch desde la API para obtener los datos del cliente
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://e-bio-link.vercel.app';
    const response = await fetch(`${baseUrl}/api/get-client-by-slug?slug=${slug}`);

    if (!response.ok) {
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
        {
          width: 1200,
          height: 630,
        }
      );
    }

    const perfil = await response.json();

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
            {/* Badge */}
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
            {/* Círculo decorativo */}
            <div
              style={{
                position: 'absolute',
                width: 400,
                height: 400,
                background: '#dbeafe',
                borderRadius: '50%',
              }}
            ></div>

            {/* Foto o placeholder */}
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
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
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
          Error generando imagen
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
