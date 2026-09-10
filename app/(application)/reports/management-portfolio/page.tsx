'use client'

import { ManagementPortfolioReportActions } from '@/components/shared/management-portfolio-report-actions'

export default function Page() {
  return <div className="content reports-page" dir="rtl"><div className="module-title"><div><span className="overline">ملف موحّد</span><h1>ملخص إدارة الأملاك الشامل</h1><p>إحصائيات الملاك وتنبيهات التأخير، مع صفحة كاملة لكل مالك في ملف تصدير واحد.</p></div><ManagementPortfolioReportActions /></div><section className="card report-panel"><h2>محتويات الملف</h2><p className="report-note">تتضمن الصفحة الأولى ملخص المحفظة وإحصائيات كل مالك. يلي ذلك ملف تفصيلي لكل مالك، يحتوي على المستأجرين والاستحقاقات والمدفوعات والمصروفات والرصيد المستحق.</p></section></div>
}
