'use client'

import { FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { DemandLetterDialog } from '@/components/shared/demand-letter-dialog'
import { DataTable } from '@/components/shared/data-table'
import { listOpenReceivables, type Receivable } from '@/features/payments/api'

const money = (value: number) => `${new Intl.NumberFormat('ar-SA').format(value)} ر.س`

export function ReceivablesListPage() {
  const [items, setItems] = useState<Receivable[]>([])
  const [selected, setSelected] = useState<Receivable | null>(null)
  const [error, setError] = useState('')
  const reload = async () => setItems((await listOpenReceivables()).items)
  useEffect(() => { const timer = setTimeout(() => void reload().catch(error => setError(error instanceof Error ? error.message : 'تعذر تحميل الاستحقاقات.')), 0); return () => clearTimeout(timer) }, [])
  return <div className="content"><div className="module-title"><div><span className="overline">التحصيل المالي</span><h1>الاستحقاقات</h1><p>تعرض هذه القائمة الأرصدة المفتوحة التي يحسبها الخادم من التوزيعات المؤكدة فقط.</p></div></div>{error && <p className="error-message">{error}</p>}<DataTable rows={items} columns={[{ key: 'tenantName', title: 'المستأجر', render: value => String(value ?? '—') }, { key: 'propertyName', title: 'العقار', render: value => String(value ?? '—') }, { key: 'dueDate', title: 'تاريخ الاستحقاق' }, { key: 'originalAmount', title: 'القيمة المستحقة', render: value => money(Number(value)) }, { key: 'paidAmount', title: 'المدفوع', render: value => money(Number(value)) }, { key: 'balance', title: 'المتبقي', render: value => money(Number(value)) }, { key: 'status', title: 'الحالة' }, { key: 'id', title: 'إجراء', render: (_value, row) => <button className="icon-action" type="button" onClick={() => setSelected(row)}><FileText size={16} /> خطاب مطالبة</button> }]} /><DemandLetterDialog receivable={selected} onClose={() => { setSelected(null); void reload().catch(error => setError(error instanceof Error ? error.message : 'تعذر تحديث الاستحقاقات.')) }} /></div>
}
