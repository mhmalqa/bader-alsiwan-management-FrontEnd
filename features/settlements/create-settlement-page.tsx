'use client'

import { useRouter } from 'next/navigation'
import { CreateSettlementModal } from './create-settlement-modal'

export function CreateSettlementPage() {
  const router = useRouter()
  return <CreateSettlementModal open onClose={() => router.replace('/owner-settlements')} />
}
