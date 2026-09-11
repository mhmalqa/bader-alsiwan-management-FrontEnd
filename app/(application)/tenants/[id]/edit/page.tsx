import { TenantFormPage } from '@/features/tenants/form-page'; export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <TenantFormPage id={(await params).id} /> }
