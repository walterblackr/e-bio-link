import { redirect } from 'next/navigation';
import { requireActiveClient } from '../../../lib/auth/client-auth';
import PanelClient from './PanelClient';

export default async function PanelPage() {
  let client: Awaited<ReturnType<typeof requireActiveClient>>;
  try {
    client = await requireActiveClient();
  } catch {
    redirect('/login');
  }

  return <PanelClient client={client} />;
}
