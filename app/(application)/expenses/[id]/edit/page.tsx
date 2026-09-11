import { ExpenseEditPage } from '@/features/expenses/edit-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <ExpenseEditPage id={(await params).id} /> }
