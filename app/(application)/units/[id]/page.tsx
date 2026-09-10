import { UnitDetailsPage } from '@/features/units/pages'; export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <UnitDetailsPage id={(await params).id} /> }
