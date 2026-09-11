import { UnitFormPage } from '@/features/units/form-page'; export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <UnitFormPage id={(await params).id} /> }
