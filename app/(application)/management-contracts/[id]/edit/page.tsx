import { ManagementContractEditPage } from '@/features/management-contracts/edit-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <ManagementContractEditPage id={(await params).id} /> }
