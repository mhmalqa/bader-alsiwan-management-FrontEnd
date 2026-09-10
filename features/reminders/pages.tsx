'use client'

import { BellRing, Check, Plus } from 'lucide-react'
import { useState } from 'react'
import { remindersData } from '@/mocks/operations-data'
import type { Reminder } from '@/types/domain'

const rentRules = ['قبل الاستحقاق بـ 30 يوماً', 'قبل الاستحقاق بـ 15 يوماً', 'قبل الاستحقاق بـ 7 أيام', 'قبل الاستحقاق بـ 3 أيام', 'يوم الاستحقاق', 'بعد الاستحقاق بيوم', 'بعد الاستحقاق بـ 3 أيام', 'بعد الاستحقاق بـ 7 أيام', 'بعد الاستحقاق بـ 15 يوماً']
const contractRules = ['قبل 90 يوماً', 'قبل 60 يوماً', 'قبل 30 يوماً', 'قبل 15 يوماً', 'قبل 7 أيام']

export function RemindersPage() {
  const [rent, setRent] = useState(() => new Set([rentRules[2], rentRules[4], rentRules[6]]))
  const [contract, setContract] = useState(() => new Set([contractRules[2], contractRules[4]]))
  const [saved, setSaved] = useState(false)
  const toggle = (setValue: React.Dispatch<React.SetStateAction<Set<string>>>, rule: string) => setValue((current) => { const next = new Set(current); next.has(rule) ? next.delete(rule) : next.add(rule); return next })
  const rules = (title: string, items: string[], active: Set<string>, update: React.Dispatch<React.SetStateAction<Set<string>>>) => <section className="card rule-card"><h2>{title}</h2><p>اختر الموعد الذي ينشئ النظام عنده تذكيراً تلقائياً.</p>{items.map((rule) => <label className="rule-toggle" key={rule}><input type="checkbox" checked={active.has(rule)} onChange={() => toggle(update, rule)} /><span><i>{active.has(rule) && <Check size={13} />}</i>{rule}</span></label>)}</section>
  const typeLabel = (type?: Reminder['type']) => ({ rent_due: 'دفعة إيجار', contract_expiry: 'انتهاء عقد', maintenance: 'صيانة', custom: 'مخصص' })[type ?? 'custom']

  return <div className="content"><div className="module-title"><div><span className="overline">التذكيرات والمهام</span><h1>إعدادات التذكيرات</h1><p>ذكّر فريقك والمستأجرين قبل الاستحقاق، وعند التأخر أو قرب انتهاء العقود.</p></div><button className="add-button" onClick={() => setSaved(true)}><BellRing size={16} /> حفظ الإعدادات</button></div>{saved && <p className="success-message">تم حفظ إعدادات الواجهة التجريبية.</p>}<div className="reminder-grid">{rules('تذكيرات دفعات الإيجار', rentRules, rent, setRent)}{rules('تذكيرات انتهاء العقود', contractRules, contract, setContract)}<section className="card rule-card"><h2>التذكيرات المجدولة</h2>{remindersData.map((item) => <div className="summary-row" key={item.id}><div><b>{item.title}</b><span>{typeLabel(item.type)} · الموعد {item.reminderDate}</span></div><span>{item.status === 'active' ? 'مفعّل' : 'متوقف'}</span></div>)}<button className="cancel-button"><Plus size={15} /> إضافة تذكير مخصص</button></section></div></div>
}
