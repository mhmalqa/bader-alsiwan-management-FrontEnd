'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, Building2, ChevronDown, ChevronLeft, FileBarChart, FileText, LayoutDashboard, Menu, Plus, Settings, Users, WalletCards, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AppToastHost } from '@/components/shared/app-toast'

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard }
type NavGroup = { id: string; label: string; icon: typeof LayoutDashboard; items: NavItem[] }
const groups: NavGroup[] = [
  { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard, items: [{ href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard }] },
  { id: 'portfolio', label: 'إدارة الأملاك', icon: Building2, items: [{ href: '/owners', label: 'الملاك', icon: Users }, { href: '/management-contracts', label: 'عقود الإدارة', icon: FileText }, { href: '/properties', label: 'العقارات', icon: Building2 }, { href: '/units', label: 'الوحدات والشقق والأدوار', icon: Building2 }, { href: '/tenants', label: 'المستأجرون', icon: Users }, { href: '/leases', label: 'عقود الإيجار', icon: FileText }] },
  { id: 'finance', label: 'المالية والتشغيل', icon: WalletCards, items: [{ href: '/receivables', label: 'الاستحقاقات والتحصيل', icon: WalletCards }, { href: '/payments', label: 'المدفوعات', icon: WalletCards }, { href: '/bank-reconciliation', label: 'المطابقة البنكية', icon: WalletCards }, { href: '/expenses', label: 'المصروفات', icon: WalletCards }, { href: '/maintenance', label: 'طلبات الصيانة', icon: Wrench }, { href: '/owner-settlements', label: 'تسويات الملاك', icon: WalletCards }] },
  { id: 'tools', label: 'المتابعة والتقارير', icon: FileBarChart, items: [{ href: '/reminders', label: 'المهام والتذكيرات', icon: Bell }, { href: '/documents', label: 'المستندات والخطابات', icon: FileText }, { href: '/reports', label: 'التقارير', icon: FileBarChart }, { href: '/settings', label: 'الإعدادات', icon: Settings }] },
]

function GroupTree({ group, pathname, expanded, toggle, close }: { group: NavGroup; pathname: string; expanded: boolean; toggle: () => void; close: () => void }) {
  const Icon = group.icon
  const activeGroup = group.items.some((item) => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`)))
  return <section className={`nav-tree ${expanded ? 'expanded' : ''} ${activeGroup ? 'contains-active' : ''}`}><button className="nav-group-trigger" onClick={toggle}><Icon size={18} /><span>{group.label}</span><ChevronDown size={16} /></button><div className="nav-children">{group.items.map((item) => { const ItemIcon = item.icon; const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`)); return <Link href={item.href} className={active ? 'active' : ''} key={item.href} onClick={close}><span className="tree-line" /><ItemIcon size={16} /><span>{item.label}</span>{active && <ChevronLeft size={14} className="nav-arrow" />}</Link> })}</div></section>
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>('dashboard')
  const [ready, setReady] = useState(false)
  const setCreateOpen = (_open: boolean) => { router.push('/owners/new') }
  useEffect(() => { const timer = window.setTimeout(() => setReady(true), 0); return () => window.clearTimeout(timer) }, [])
  if (!ready) return <div className="app-shell" dir="rtl" />
  return <div className="app-shell" dir="rtl">
    <button className="mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label="فتح القائمة"><Menu /></button>
    <aside className={mobileOpen ? 'app-sidebar open' : 'app-sidebar'}><div className="brand-lockup"><Image src="/logo.png" alt="بدر الصيوان للعقارات" width={184} height={64} priority className="brand-image" /><span>نظام إدارة الأملاك</span></div><nav className="tree-navigation">{groups.map((group) => <GroupTree key={group.id} group={group} pathname={pathname} expanded={expanded === group.id} toggle={() => setExpanded(expanded === group.id ? null : group.id)} close={() => setMobileOpen(false)} />)}</nav><div className="sidebar-profile"><div className="profile-avatar">أ</div><div><b>أحمد السالم</b><span>مدير النظام</span></div></div></aside>
    <main className="app-main"><header className="app-header"><div className="header-title"><small>إدارة الأملاك</small><strong>شركة بدر الصيوان للعقارات</strong></div><div className="header-tools"><Link className="notification-button" href="/notifications" aria-label="الإشعارات"><Bell size={20} /><i>2</i></Link><button className="quick-add" onClick={() => setCreateOpen(true)}><Plus size={17} /> إضافة جديد</button></div></header>{children}</main>
    <AppToastHost />
  </div>
}
