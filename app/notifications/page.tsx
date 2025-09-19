
import { protectPage } from '@/lib/session';
import { NotificationsPage } from '@/components/pages/notifications-page';

export default async function Notifications() {
  await protectPage();

  return <NotificationsPage />;
}
