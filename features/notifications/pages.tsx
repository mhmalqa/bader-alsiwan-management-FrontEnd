'use client'

import { CheckCheck, Circle } from 'lucide-react'
import { useState } from 'react'
import { notificationsData } from '@/mocks/operations-data'
import { notificationRepository } from '@/features/core/api/mock-repositories'
import type { Notification } from '@/types/domain'

export function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>(() => notificationsData.map((item) => ({ ...item })))
  const markRead = (id: string) => { notificationRepository.update(id, { isRead: true }).then(() => setItems((current) => current.map((item) => item.id === id ? { ...item, isRead: true } : item))) }
  const markAllRead = () => { Promise.all(items.filter((item) => !item.isRead).map((item) => notificationRepository.update(item.id, { isRead: true }))).then(() => setItems((current) => current.map((item) => ({ ...item, isRead: true })))) }
  const unread = items.filter((item) => !item.isRead).length

  return <div className="content">
    <div className="module-title">
      <div><span className="overline">مركز الإشعارات</span><h1>الإشعارات</h1><p>تنبيهات التحصيل والعقود والصيانة التي تحتاج متابعتك.</p></div>
      <button className="add-button" onClick={markAllRead}><CheckCheck size={16} /> تحديد الكل كمقروء</button>
    </div>
    <section className="card notification-summary"><b>غير المقروءة: {unread}</b><span>تُحفظ حالة القراءة في بيانات الواجهة التجريبية لحين ربط واجهة البرمجة.</span></section>
    <section className="card notification-list">
      {items.map((item) => <button className={`notification-row ${item.isRead ? 'is-read' : ''}`} key={item.id} onClick={() => markRead(item.id)}>
        <Circle size={10} fill={item.isRead ? 'transparent' : 'currentColor'} aria-label={item.isRead ? 'مقروء' : 'غير مقروء'} />
        <span><b>{item.title}</b><small>{item.body}</small></span><time>{item.createdAt}</time>
      </button>)}
    </section>
  </div>
}
