import { requireActiveClient } from '../../../lib/auth/client-auth';
import { redirect } from 'next/navigation';
import OnboardingWizard from './OnboardingWizard';

export default async function OnboardingPage() {
  try {
    const client = await requireActiveClient();
    return <OnboardingWizard clientData={client} />;
  } catch (error) {
    redirect('/register');
  }
}
