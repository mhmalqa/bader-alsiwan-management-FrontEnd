import { LeaseEditPage } from '@/features/leases/edit-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <LeaseEditPage id={(await params).id} /> }
