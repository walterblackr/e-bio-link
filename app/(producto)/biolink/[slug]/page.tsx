import { neon } from '@neondatabase/serverless';
import { notFound } from 'next/navigation';
import BioLinkTemplate from '@/app/components/BioLinkTemplate';

// Tipo para los datos del médico desde la BD
interface MedicoData {
  slug: string;
  nombre_completo: string;
  foto_url: string;
  especialidad?: string;
  matricula?: string;
  descripcion?: string;
  botones_config: any[];
  tema_config: any;
  tiene_eventos?: boolean;
  cal_username?: string;
}

// En Next.js 15/16 params es una Promesa, hay que definirlo así:
interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BioLinkPage({ params }: PageProps) {
  // 1. Esperamos a obtener el slug de la URL
  const { slug } = await params;

  // 2. Conectamos a la BD
  const sql = neon(process.env.DATABASE_URL!);

  // 3. Consultamos los datos
  // IMPORTANTE: NO traemos los tokens de seguridad (mp_access_token, etc)
  const response = await sql`
    SELECT
      slug,
      nombre_completo,
      foto_url,
      especialidad,
      matricula,
      descripcion,
      botones_config,
      tema_config,
      cal_username
    FROM clients
    WHERE slug = ${slug}
    LIMIT 1
  `;

  const medico = response[0] as MedicoData | undefined;

  // 4. Si no existe, mandamos a página 404
  if (!medico) {
    notFound();
  }

  // 5. Verificar si tiene eventos activos para mostrar el botón de turnos
  const eventosResult = await sql`
    SELECT COUNT(*) as count FROM eventos
    WHERE client_id = (SELECT id FROM clients WHERE slug = ${slug} LIMIT 1)
      AND activo = true
  `;
  const tiene_eventos = Number(eventosResult[0]?.count) > 0;

  // 6. Renderizamos el componente cliente con los datos reales
  return <BioLinkTemplate data={{ ...medico, tiene_eventos }} />;
}

// Opcional: Generar metadata dinámica para SEO y Open Graph (WhatsApp)
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const sql = neon(process.env.DATABASE_URL!);

  const response = await sql`
    SELECT nombre_completo, especialidad, descripcion
    FROM clients
    WHERE slug = ${slug}
    LIMIT 1
  `;

  const medico = response[0];

  if (!medico) {
    return {
      title: 'Perfil no encontrado',
    };
  }

  const title = medico.especialidad
    ? `${medico.nombre_completo} - ${medico.especialidad}`
    : medico.nombre_completo;

  const description = medico.descripcion
    ? medico.descripcion
    : `Agenda tu consulta con ${medico.nombre_completo}${medico.especialidad ? `, ${medico.especialidad}` : ''}`;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://e-bio-link.vercel.app';
  const bioLinkUrl = `${baseUrl}/biolink/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title: `📅 Turnos: ${medico.nombre_completo}`,
      description: `Reserva tu cita con ${medico.nombre_completo} en segundos.`,
      url: bioLinkUrl,
      siteName: 'e-bio-link.vercel.app',
      images: [
        {
          url: `${baseUrl}/api/og/${slug}`,
          width: 1200,
          height: 630,
          alt: `${medico.nombre_completo}${medico.especialidad ? ` - ${medico.especialidad}` : ''}`,
        },
      ],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Turnos con ${medico.nombre_completo}`,
      description: `Reserva online con ${medico.nombre_completo}`,
    },
  };
}
