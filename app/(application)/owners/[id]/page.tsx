import { OwnerDetailsPage } from '@/features/owners/pages'; export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <OwnerDetailsPage id={(await params).id} /> }
