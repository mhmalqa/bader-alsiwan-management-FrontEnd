'use client'

import { CheckCircle2, X } from 'lucide-react'
import { useEffect, useState } from 'react'

type ToastDetail = { title: string; description?: string }
const eventName = 'bader:toast-success'

export function notifySuccess(detail: ToastDetail) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent<ToastDetail>(eventName, { detail }))
}

export function AppToastHost() {
  const [toast, setToast] = useState<ToastDetail | null>(null)
  useEffect(() => { const show = (event: Event) => { const next = event as CustomEvent<ToastDetail>; setToast(next.detail); window.setTimeout(() => setToast(null), 4200) }; window.addEventListener(eventName, show); return () => window.removeEventListener(eventName, show) }, [])
  if (!toast) return null
  return <aside className="app-toast app-toast--success" role="status" aria-live="polite"><CheckCircle2 size={22} /><div><b>{toast.title}</b>{toast.description && <span>{toast.description}</span>}</div><button type="button" onClick={() => setToast(null)} aria-label="إخفاء رسالة النجاح"><X size={17} /></button></aside>
}
