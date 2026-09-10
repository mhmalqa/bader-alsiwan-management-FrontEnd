import type { CollectionFollowUp, CommunicationLog, DocumentTemplate, GeneratedDocument, MaintenanceRequest, Notification, Reminder } from '@/types/domain'

export const maintenanceRequests: MaintenanceRequest[] = [
  { id: '1', propertyId: '1', unitId: '1', ownerId: '1', title: 'تسرب مياه في مكتب 203', description: 'فحص وإصلاح التسرب في دورة المياه.', estimatedCost: 2400, status: 'draft', requiresOwnerApproval: true, priority: 'high', requestedAt: '2026-01-15', vendorName: 'مؤسسة الإصلاح السريع', approvalStatus: 'pending' },
]

export const remindersData: Reminder[] = [
  { id: '1', title: 'متابعة القسط الثاني', dueDate: '2026-03-25', reminderDate: '2026-03-18', status: 'active', type: 'rent_due', relatedEntityType: 'receivable', relatedEntityId: '2', recipients: ['المستأجر', 'موظف التحصيل'] },
  { id: '2', title: 'تجديد عقد الإدارة', dueDate: '2026-11-30', reminderDate: '2026-10-31', status: 'active', type: 'contract_expiry', relatedEntityType: 'management_contract', relatedEntityId: '1', recipients: ['المالك', 'مدير العقود'] },
]

export const notificationsData: Notification[] = [
  { id: '1', title: 'تم تسجيل دفعة', body: 'تم تحصيل 30,000 ر.س من شركة أبعاد للمقاولات.', isRead: false, createdAt: '2026-01-03' },
  { id: '2', title: 'طلب صيانة يحتاج اعتماداً', body: 'طلب مكتب 203 تجاوز حد الاعتماد المحدد.', isRead: false, createdAt: '2026-01-15' },
]

export const collectionFollowUps: CollectionFollowUp[] = []
export const communicationLogs: CommunicationLog[] = []
export const generatedDocuments: GeneratedDocument[] = []

export const documentTemplatesData: DocumentTemplate[] = [
  { id: '1', name: 'خطاب مطالبة بسداد', category: 'التحصيل', bodyHtml: '<h1>خطاب مطالبة بسداد</h1>', isActive: true },
  { id: '2', name: 'إشعار استحقاق', category: 'التحصيل', bodyHtml: '<h1>إشعار استحقاق</h1>', isActive: true },
  { id: '3', name: 'إشعار تأخر', category: 'التحصيل', bodyHtml: '<h1>إشعار تأخر</h1>', isActive: true },
  { id: '4', name: 'خطاب انتهاء عقد', category: 'العقود', bodyHtml: '<h1>خطاب انتهاء عقد</h1>', isActive: true },
  { id: '5', name: 'خطاب تجديد عقد', category: 'العقود', bodyHtml: '<h1>خطاب تجديد عقد</h1>', isActive: true },
  { id: '6', name: 'طلب موافقة صيانة', category: 'الصيانة', bodyHtml: '<h1>طلب موافقة صيانة</h1>', isActive: true },
  { id: '7', name: 'كشف حساب مالك', category: 'التقارير', bodyHtml: '<h1>كشف حساب مالك</h1>', isActive: true },
  { id: '8', name: 'كشف حساب مستأجر', category: 'التقارير', bodyHtml: '<h1>كشف حساب مستأجر</h1>', isActive: true },
  { id: '9', name: 'سند قبض', category: 'المالية', bodyHtml: '<h1>سند قبض</h1>', isActive: true },
  { id: '10', name: 'إشعار تحويل للمالك', category: 'المالية', bodyHtml: '<h1>إشعار تحويل للمالك</h1>', isActive: true },
  { id: '11', name: 'محضر استلام وحدة', category: 'التشغيل', bodyHtml: '<h1>محضر استلام وحدة</h1>', isActive: true },
  { id: '12', name: 'محضر تسليم وحدة', category: 'التشغيل', bodyHtml: '<h1>محضر تسليم وحدة</h1>', isActive: true },
]
