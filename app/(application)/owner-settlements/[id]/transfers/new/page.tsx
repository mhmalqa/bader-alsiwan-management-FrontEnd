import { SettlementFormPage } from '@/features/settlements/pages'
export default async function Page({params}:{params:Promise<{id:string}>}) { return <SettlementFormPage id={(await params).id} /> }
