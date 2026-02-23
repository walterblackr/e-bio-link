// app/reserva/[slug]/page.tsx
// Página de reserva de turno - lo que ve el paciente

import { neon } from '@neondatabase/serverless';
import { notFound } from 'next/navigation';
import BookingFlow from './BookingFlow';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ReservaPage({ params }: PageProps) {
  const { slug } = await params;
  const sql = neon(process.env.DATABASE_URL!);

  // Obtener datos del profesional
  const clientResult = await sql`
    SELECT
      id,
      slug,
      nombre_completo,
      foto_url,
      especialidad,
      matricula,
      descripcion,
      tema_config,
      payment_method
    FROM clients
    WHERE slug = ${slug}
      AND status = 'active'
    LIMIT 1
  `;

  if (clientResult.length === 0) {
    notFound();
  }

  const medico = clientResult[0];

  // Obtener eventos activos del profesional
  const eventosResult = await sql`
    SELECT id, nombre, descripcion, duracion_minutos, precio, modalidad
    FROM eventos
    WHERE client_id = ${medico.id}
      AND activo = true
    ORDER BY precio ASC
  `;

  if (eventosResult.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-gray-500 text-lg">
            Este profesional aún no tiene turnos disponibles.
          </p>
        </div>
      </main>
    );
  }

  // Obtener días de semana activos (0=Dom, 1=Lun, ..., 6=Sab)
  const disponibilidadResult = await sql`
    SELECT dia_semana
    FROM disponibilidad
    WHERE client_id = ${medico.id}
      AND activo = true
    ORDER BY dia_semana ASC
  `;
  const diasActivos = disponibilidadResult.map((d: any) => d.dia_semana as number);

  return (
    <BookingFlow
      medico={{
        slug: medico.slug,
        nombre_completo: medico.nombre_completo,
        foto_url: medico.foto_url,
        especialidad: medico.especialidad,
        matricula: medico.matricula,
        descripcion: medico.descripcion,
        tema_config: typeof medico.tema_config === 'string'
          ? JSON.parse(medico.tema_config)
          : medico.tema_config,
        payment_method: medico.payment_method || 'transfer',
      }}
      eventos={eventosResult as any[]}
      diasActivos={diasActivos}
    />
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const sql = neon(process.env.DATABASE_URL!);

  const result = await sql`
    SELECT nombre_completo, especialidad FROM clients
    WHERE slug = ${slug} LIMIT 1
  `;

  if (!result[0]) return { title: 'Reservar turno' };

  const m = result[0];
  return {
    title: `Reservar turno - ${m.nombre_completo}${m.especialidad ? ` - ${m.especialidad}` : ''}`,
  };
}
