import { OwnerFormPage } from '@/features/owners/form-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <OwnerFormPage id={(await params).id} /> }
