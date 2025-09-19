
import { protectPage } from '@/lib/session';
import { ProfilePage } from '@/components/pages/profile-page';

export default async function Profile() {
  await protectPage();

  return <ProfilePage />;
}
