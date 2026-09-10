import { LeaseDetailsPage } from '@/features/leases/pages'; export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <LeaseDetailsPage id={(await params).id} /> }
