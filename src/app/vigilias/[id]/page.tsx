import { notFound } from 'next/navigation';
import { PORTALS, getPortal } from '@/lib/content/portals';
import { PrayerSession } from '@/components/portals/PrayerSession';

export function generateStaticParams() {
  return PORTALS.map((p) => ({ id: p.id }));
}

export default async function PortalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const portal = getPortal(id);
  if (!portal) notFound();
  return <PrayerSession portalId={portal.id} />;
}
