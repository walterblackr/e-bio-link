import { neon } from '@neondatabase/serverless';
import { notFound } from 'next/navigation';
import BioLinkTemplate from '@/app/components/BioLinkTemplate';

// Tipo para los datos del médico desde la BD
interface MedicoData {
  nombre_completo: string;
  foto_url: string;
  especialidad?: string;
  matricula?: string;
  descripcion?: string;
  cal_username: string;
  botones_config: any[];
  tema_config: any;
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
      nombre_completo,
      foto_url,
      especialidad,
      matricula,
      descripcion,
      cal_username,
      botones_config,
      tema_config
    FROM clients
    WHERE slug = ${slug}
    LIMIT 1
  `;

  const medico = response[0] as MedicoData | undefined;

  // 4. Si no existe, mandamos a página 404
  if (!medico) {
    notFound();
  }

  // 5. Renderizamos el componente cliente con los datos reales
  return <BioLinkTemplate data={medico} />;
}

// Opcional: Generar metadata dinámica para SEO
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

  return {
    title,
    description,
  };
}
