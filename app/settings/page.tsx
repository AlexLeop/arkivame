
import { protectPage } from '@/lib/session';
import { SettingsPage } from '@/components/pages/settings-page';

export default async function Settings() {
  await protectPage();

  return <SettingsPage />;
}
