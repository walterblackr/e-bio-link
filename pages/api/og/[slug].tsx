import { ImageResponse } from '@vercel/og';
import type { NextRequest } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  try {
    // Obtener slug de la URL correctamente
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const slug = pathParts[pathParts.length - 1];

    if (!slug || slug === '') {
      return new Response('Slug not provided', { status: 400 });
    }

    // Consultar directamente a la BD con Neon (soporta Edge Runtime)
    const sql = neon(process.env.DATABASE_URL!);

    const result = await sql`
      SELECT slug, nombre_completo, especialidad, foto_url, matricula
      FROM clients
      WHERE slug = ${slug}
      LIMIT 1
    `;

    if (result.length === 0) {
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

    const perfil = result[0];

    // Ajuste dinámico del tamaño de fuente según longitud del nombre
    const nameFontSize =
      perfil.nombre_completo.length < 20 ? 90 :
      perfil.nombre_completo.length < 30 ? 72 : 56;

    return new ImageResponse(
      (
        <div
          style={{
            background: 'white',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'row',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            position: 'relative',
          }}
        >
          {/* Barra de acento lateral */}
          <div
            style={{
              width: '60px',
              height: '100%',
              background: 'linear-gradient(180deg, #1E40AF 0%, #2563EB 100%)',
            }}
          />

          {/* Contenido principal */}
          <div
            style={{
              display: 'flex',
              flex: 1,
              flexDirection: 'column',
              justifyContent: 'center',
              paddingLeft: 100,
              paddingRight: 100,
            }}
          >
            {/* Badge superior */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: 32,
              }}
            >
              <span
                style={{
                  color: '#2563EB',
                  fontWeight: 'bold',
                  fontSize: 24,
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  borderBottom: '2px solid #2563EB',
                  paddingBottom: 8,
                }}
              >
                Perfil Profesional
              </span>
            </div>

            {/* Nombre gigante */}
            <h2
              style={{
                fontSize: nameFontSize,
                fontWeight: 900,
                color: '#0F172A',
                lineHeight: 0.95,
                letterSpacing: '-0.02em',
                marginBottom: 24,
                textTransform: 'uppercase',
              }}
            >
              {perfil.nombre_completo}
            </h2>

            {/* Especialidad destacada */}
            <p
              style={{
                fontSize: 42,
                color: '#64748B',
                fontWeight: 500,
                marginTop: 0,
                marginBottom: 0,
              }}
            >
              {perfil.especialidad || 'Profesional de la Salud'}
            </p>

            {/* Matrícula (opcional) */}
            {perfil.matricula && (
              <p
                style={{
                  fontSize: 28,
                  color: '#94A3B8',
                  marginTop: 12,
                  marginBottom: 0,
                }}
              >
                Mat. {perfil.matricula}
              </p>
            )}

            {/* Call to Action */}
            <div
              style={{
                marginTop: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  background: '#F1F5F9',
                  color: '#475569',
                  paddingLeft: 24,
                  paddingRight: 24,
                  paddingTop: 12,
                  paddingBottom: 12,
                  borderRadius: 8,
                  fontSize: 24,
                  fontWeight: 600,
                  border: '1px solid #E2E8F0',
                }}
              >
                📅 Turnos Disponibles
              </div>

              <div
                style={{
                  color: '#CBD5E1',
                  fontSize: 24,
                  fontWeight: 700,
                }}
              >
                e-bio-link
              </div>
            </div>
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
