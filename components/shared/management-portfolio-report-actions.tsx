'use client'

import { Download, Printer } from 'lucide-react'
import * as XLSX from 'xlsx-js-style'
import { expenses, leases, owners, payments, properties, receivables, settlements, tenants, units } from '@/mocks/data'

const money = (amount: number) => `${new Intl.NumberFormat('ar-SA').format(amount)} ر.س`
const reportDate = () => new Intl.DateTimeFormat('ar-SA', { dateStyle: 'long' }).format(new Date())
const now = () => new Date().toISOString().slice(0, 10)
const escapeHtml = (value: unknown) => String(value ?? '—').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char] ?? char)

function buildOwnerReport(owner: (typeof owners)[number]) {
  const ownerProperties = properties.filter((property) => property.ownerId === owner.id)
  const propertyIds = new Set(ownerProperties.map((property) => property.id))
  const ownerUnits = units.filter((unit) => propertyIds.has(unit.propertyId))
  const ownerReceivables = receivables.filter((item) => propertyIds.has(item.propertyId))
  const ownerPayments = payments.filter((item) => propertyIds.has(item.propertyId) && item.status === 'confirmed')
  const ownerExpenses = expenses.filter((item) => propertyIds.has(item.propertyId))
  const collected = ownerPayments.reduce((sum, item) => sum + item.amount, 0)
  const outstanding = ownerReceivables.reduce((sum, item) => sum + item.remainingAmount, 0)
  const overdue = ownerReceivables.filter((item) => item.remainingAmount > 0 && item.dueDate < now()).reduce((sum, item) => sum + item.remainingAmount, 0)
  return { owner, ownerProperties, ownerUnits, ownerReceivables, ownerExpenses, collected, outstanding, overdue, expensesTotal: ownerExpenses.reduce((sum, item) => sum + item.amount, 0), balance: settlements.find((item) => item.ownerId === owner.id)?.remainingBalance ?? 0 }
}

const ownerName = (id: string) => tenants.find((tenant) => tenant.id === id)?.fullName ?? '—'
const propertyName = (id: string) => properties.find((property) => property.id === id)?.propertyName ?? '—'
const unitName = (id: string) => units.find((unit) => unit.id === id)?.unitNameOrNumber ?? '—'
const table = (headers: string[], rows: unknown[][]) => `<table><thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${headers.length}">لا توجد بيانات</td></tr>`}</tbody></table>`

export function ManagementPortfolioReportActions() {
  const reports = owners.map(buildOwnerReport)
  const dashboard = reports.map((report) => [report.owner.fullName, report.ownerProperties.length, report.ownerUnits.length, report.ownerUnits.filter((unit) => unit.status === 'occupied').length, money(report.collected), money(report.outstanding), money(report.overdue), money(report.expensesTotal), money(report.balance)])
  const print = () => {
    const popup = window.open('', '_blank', 'noopener,noreferrer')
    if (!popup) return
    const total = (field: 'collected' | 'outstanding' | 'overdue') => reports.reduce((sum, report) => sum + report[field], 0)
    const detailPages = reports.map((report) => {
      const receivableRows = report.ownerReceivables.map((item) => [ownerName(item.tenantId), propertyName(item.propertyId), unitName(item.unitId), item.dueDate, money(item.originalAmount), money(item.paidAmount), money(item.remainingAmount), item.remainingAmount > 0 && item.dueDate < now() ? 'متأخر' : item.status])
      const expenseRows = report.ownerExpenses.map((item) => [item.description, propertyName(item.propertyId), item.category, item.expenseDate, item.vendorName ?? '—', money(item.amount)])
      return `<section class="owner-page"><header><h1>ملف المالك: ${escapeHtml(report.owner.fullName)}</h1><p>${escapeHtml(report.owner.ownerCode)} · ${escapeHtml(report.owner.mobilePrimary)}</p></header><div class="metrics"><div>العقارات<b>${report.ownerProperties.length}</b></div><div>الوحدات المشغولة<b>${report.ownerUnits.filter((unit) => unit.status === 'occupied').length} / ${report.ownerUnits.length}</b></div><div>المحصلات<b>${money(report.collected)}</b></div><div>المتبقي<b>${money(report.outstanding)}</b></div><div>المتأخرات<b class="danger">${money(report.overdue)}</b></div><div>المصروفات<b>${money(report.expensesTotal)}</b></div><div>رصيد المالك<b>${money(report.balance)}</b></div></div><h2>المستأجرون والاستحقاقات والدفعات</h2>${table(['المستأجر', 'العقار', 'الوحدة', 'تاريخ الاستحقاق', 'المستحق', 'المدفوع', 'المتبقي', 'الحالة'], receivableRows)}<h2>المصروفات</h2>${table(['البيان', 'العقار', 'الفئة', 'التاريخ', 'المورد', 'المبلغ'], expenseRows)}</section>`
    }).join('')
    popup.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>ملخص إدارة الأملاك</title><style>body{font-family:Tahoma,Arial,sans-serif;color:#173d2a;padding:28px;direction:rtl}header{border-bottom:3px solid #178553;padding-bottom:15px}h1{margin:0;font-size:25px}h2{margin:26px 0 8px;font-size:17px}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:18px 0}.metrics div{background:#f2f8f3;padding:11px;border-radius:7px}.metrics b{display:block;color:#087044;margin-top:6px}.danger{color:#bf3a2b!important}table{width:100%;border-collapse:collapse;margin-bottom:18px}th{background:#16794e;color:white}th,td{padding:8px;border:1px solid #d6e3d9;text-align:right;font-size:12px}tr:nth-child(even){background:#f7faf7}.owner-page{break-before:page;page-break-before:always}@media print{body{padding:0}}</style></head><body><header><h1>ملخص إدارة الأملاك</h1><p>تقرير شامل صادر بتاريخ ${reportDate()}</p></header><div class="metrics"><div>عدد الملاك<b>${reports.length}</b></div><div>إجمالي المحصلات<b>${money(total('collected'))}</b></div><div>إجمالي المتبقي<b>${money(total('outstanding'))}</b></div><div>إجمالي المتأخرات<b class="danger">${money(total('overdue'))}</b></div></div><h2>إحصائيات الملاك والتنبيهات المالية</h2>${table(['المالك', 'العقارات', 'الوحدات', 'المشغولة', 'المحصلات', 'المتبقي', 'المتأخرات', 'المصروفات', 'رصيد المالك'], dashboard)}${detailPages}</body></html>`)
    popup.document.close(); popup.focus(); popup.print()
  }
  const excel = () => {
    const workbook = XLSX.utils.book_new()
    const addSheet = (name: string, rows: unknown[][]) => { const sheet = XLSX.utils.aoa_to_sheet(rows); const columns = Math.max(...rows.map((row) => row.length), 1); for (let column = 0; column < columns; column += 1) { const cell = sheet[XLSX.utils.encode_cell({ r: 0, c: column })]; if (cell) cell.s = { fill: { fgColor: { rgb: '16794E' } }, font: { bold: true, color: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'center' } } } sheet['!cols'] = Array.from({ length: columns }, () => ({ wch: 22 })); (sheet as unknown as Record<string, unknown>)['!rtl'] = true; XLSX.utils.book_append_sheet(workbook, sheet, name.slice(0, 31)) }
    addSheet('ملخص الإدارة', [['المالك', 'العقارات', 'الوحدات', 'المشغولة', 'المحصلات', 'المتبقي', 'المتأخرات', 'المصروفات', 'رصيد المالك'], ...dashboard])
    reports.forEach((report, index) => addSheet(`${index + 1}-${report.owner.fullName}`, [['ملف المالك', report.owner.fullName], ['الجوال', report.owner.mobilePrimary], ['المحصلات', money(report.collected)], ['المتبقي', money(report.outstanding)], ['المتأخرات', money(report.overdue)], ['المصروفات', money(report.expensesTotal)], [], ['المستأجر', 'العقار', 'الوحدة', 'الاستحقاق', 'المستحق', 'المدفوع', 'المتبقي', 'الحالة'], ...report.ownerReceivables.map((item) => [ownerName(item.tenantId), propertyName(item.propertyId), unitName(item.unitId), item.dueDate, money(item.originalAmount), money(item.paidAmount), money(item.remainingAmount), item.remainingAmount > 0 && item.dueDate < now() ? 'متأخر' : item.status]), [], ['المصروفات'], ['البيان', 'العقار', 'الفئة', 'التاريخ', 'المورد', 'المبلغ'], ...report.ownerExpenses.map((item) => [item.description, propertyName(item.propertyId), item.category, item.expenseDate, item.vendorName ?? '—', money(item.amount)])]))
    XLSX.writeFile(workbook, 'ملخص-إدارة-الأملاك.xlsx', { compression: true })
  }
  return <div className="portfolio-report-actions"><button type="button" className="cancel-button" onClick={print}><Printer size={16} /> طباعة / PDF كامل</button><button type="button" className="add-button" onClick={excel}><Download size={16} /> تصدير Excel كامل</button></div>
}
