'use client'

import { useRouter } from 'next/navigation'
import { LeaseCreateModal } from './lease-create-modal'

export function NewLeasePage() {
  const router = useRouter()
  return <LeaseCreateModal open onClose={() => router.replace('/leases')} />
}
