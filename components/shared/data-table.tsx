'use client'

import { ArrowDownUp, ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react'
import { useMemo, useState } from 'react'
// Relationship labels are supplied by API view models; this generic table never reads local fixtures.
const leases: { id: string; internalContractNumber: string }[] = []
const owners: { id: string; fullName: string }[] = []
const properties: { id: string; propertyName: string }[] = []
const tenants: { id: string; fullName: string }[] = []
const units: { id: string; unitNameOrNumber: string }[] = []

const statuses: Record<string, string> = { active: 'نشط', inactive: 'غير نشط', archived: 'مؤرشف', draft: 'مسودة', confirmed: 'مؤكد', cancelled: 'ملغي', vacant: 'شاغرة', occupied: 'مؤجرة', reserved: 'محجوزة', maintenance: 'صيانة', unavailable: 'غير متاحة', expired: 'منتهي', terminated: 'منهى', renewed: 'مجدد', upcoming: 'قادم', due_soon: 'مستحق قريبًا', due_today: 'مستحق اليوم', partially_paid: 'مدفوع جزئيًا', paid: 'مدفوع', overdue: 'متأخر', reversed: 'ملغاة' }
const methods: Record<string, string> = { annual: 'سنوي', semi_annual: 'نصف سنوي', quarterly: 'ربع سنوي', monthly: 'شهري', one_time: 'دفعة واحدة', custom: 'مخصص', bank_transfer: 'تحويل بنكي', cash: 'نقدي', cheque: 'شيك', card: 'بطاقة', percentage_of_collections: 'نسبة من التحصيل' }
const amountKeys = new Set(['amount', 'annualRent', 'expectedAnnualRent', 'originalAmount', 'paidAmount', 'remainingAmount', 'grossCollections', 'netDueToOwner', 'transferAmount', 'remainingBalance', 'totalContractValue'])
function displayValue(key: string, value: unknown): string { const raw = String(value ?? ''); if (!raw) return '—'; if (key === 'tenantId') return tenants.find((item) => item.id === raw)?.fullName ?? raw; if (key === 'ownerId') return owners.find((item) => item.id === raw)?.fullName ?? raw; if (key === 'propertyId') return properties.find((item) => item.id === raw)?.propertyName ?? raw; if (key === 'unitId') return units.find((item) => item.id === raw)?.unitNameOrNumber ?? raw; if (key === 'leaseId') return leases.find((item) => item.id === raw)?.internalContractNumber ?? raw; if (key === 'status' || key === 'managementStatus') return statuses[raw] ?? raw; if (key === 'paymentFrequency' || key === 'paymentMethod' || key === 'managementFeeMethod') return methods[raw] ?? raw; if (amountKeys.has(key) && typeof value === 'number') return `${new Intl.NumberFormat('ar-SA').format(value)} ر.س`; return raw }
export interface Column<T> { key: keyof T; title: string; render?: (value: T[keyof T], row: T) => React.ReactNode }

export function DataTable<T extends { id: string }>({ rows, columns }: { rows: T[]; columns: Column<T>[] }) {
  const [queryDraft, setQueryDraft] = useState('')
  const [query, setQuery] = useState('')
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState<keyof T | null>(null)
  const [ascending, setAscending] = useState(true)
  const normalise = (value: string) => value.toLocaleLowerCase('ar').trim()
  const filtered = useMemo(() => rows.filter((row) => { const matchesSearch = !query || Object.entries(row).some(([key, value]) => normalise(displayValue(key, value)).includes(normalise(query))); const matchesColumns = Object.entries(columnFilters).every(([key, value]) => !value || normalise(displayValue(key, row[key as keyof T])).includes(normalise(value))); return matchesSearch && matchesColumns }).sort((left, right) => { if (!sortKey) return 0; const a = displayValue(String(sortKey), left[sortKey]); const b = displayValue(String(sortKey), right[sortKey]); return ascending ? a.localeCompare(b, 'ar') : b.localeCompare(a, 'ar') }), [rows, query, columnFilters, sortKey, ascending])
  const perPage = 10; const shown = filtered.slice((page - 1) * perPage, page * perPage); const pages = Math.max(1, Math.ceil(filtered.length / perPage))
  const filterColumn = (key: string, value: string) => { setColumnFilters((current) => ({ ...current, [key]: value })); setPage(1) }
  const clear = () => { setQueryDraft(''); setQuery(''); setColumnFilters({}); setPage(1) }
  const toggleSort = (key: keyof T) => { setPage(1); if (sortKey === key) setAscending(!ascending); else { setSortKey(key); setAscending(true) } }
  return <section className="card table-card"><div className="table-toolbar"><form className="table-search" onSubmit={(event) => { event.preventDefault(); setQuery(queryDraft); setPage(1) }}><Search size={17} /><input value={queryDraft} onChange={(event) => setQueryDraft(event.target.value)} placeholder="ابحث في جميع النتائج..." /><button className="table-search-button" type="submit">بحث</button></form><div className="table-filter-status"><button className={`filter-panel-toggle ${filtersOpen ? 'open' : ''}`} onClick={() => setFiltersOpen(!filtersOpen)}><SlidersHorizontal size={16} /> فلاتر الأعمدة <ChevronDown size={15} /></button><span>{filtered.length} سجل</span>{(query || Object.values(columnFilters).some(Boolean)) && <button className="clear-filters" onClick={clear}><X size={15} /> مسح الفلاتر</button>}</div></div><div className="table-wrap"><table><thead><tr>{columns.map((column) => <th key={String(column.key)}><button className="column-sort" onClick={() => toggleSort(column.key)}>{column.title}<ArrowDownUp size={13} /></button></th>)}</tr>{filtersOpen && <tr className="column-filter-row">{columns.map((column) => <th key={String(column.key)}><input aria-label={`فلترة ${column.title}`} value={columnFilters[String(column.key)] ?? ''} onChange={(event) => filterColumn(String(column.key), event.target.value)} placeholder="فلترة..." /></th>)}</tr>}</thead><tbody>{shown.map((row) => <tr key={row.id}>{columns.map((column) => <td key={String(column.key)}>{column.render ? column.render(row[column.key], row) : displayValue(String(column.key), row[column.key])}</td>)}</tr>)}{shown.length === 0 && <tr><td colSpan={columns.length}>لا توجد نتائج مطابقة للفلاتر المحددة.</td></tr>}</tbody></table></div><div className="pagination"><button disabled={page === 1} onClick={() => setPage(page - 1)}>السابق</button><span>صفحة {page} من {pages}</span><button disabled={page === pages} onClick={() => setPage(page + 1)}>التالي</button></div></section>
}
