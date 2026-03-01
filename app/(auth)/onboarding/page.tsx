import { requireActiveClient } from '../../../lib/auth/client-auth';
import { neon } from '@neondatabase/serverless';
import { redirect } from 'next/navigation';
import OnboardingWizard from './OnboardingWizard';

export default async function OnboardingPage() {
  try {
    const client = await requireActiveClient();

    // Fetch completo de datos del cliente para el wizard
    // (requireActiveClient solo retorna campos básicos de auth)
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`
      SELECT id, email, slug, nombre_completo, especialidad, matricula,
             descripcion, foto_url, monto_consulta, tema_config, botones_config,
             status, payment_method, google_refresh_token
      FROM clients WHERE id = ${client.id} LIMIT 1
    `;

    return <OnboardingWizard clientData={result[0]} />;
  } catch (error) {
    redirect('/register');
  }
}
