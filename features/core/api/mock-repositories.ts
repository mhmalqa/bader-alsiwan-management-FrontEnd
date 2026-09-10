import { createMockService, type MockService } from '@/services/mock-service'
import { expenses, leases, managementContracts, owners, payments, properties, receivables, settlements, tenants, units } from '@/mocks/data'
import type { Expense, LeaseContract, ManagementContract, Owner, OwnerSettlement, Payment, Property, PropertyUnit, Receivable, Tenant } from '@/types/domain'
import type { DocumentTemplate, MaintenanceRequest, Notification, Reminder } from '@/types/domain'
import { documentTemplatesData, maintenanceRequests, notificationsData, remindersData } from '@/mocks/operations-data'
import { attachmentsData } from '@/mocks/attachments-data'
import type { Attachment } from '@/types/domain'
export const ownerRepository: MockService<Owner> = createMockService(owners)
export const managementContractRepository: MockService<ManagementContract> = createMockService(managementContracts)
export const propertyRepository: MockService<Property> = createMockService(properties)
export const unitRepository: MockService<PropertyUnit> = createMockService(units)
export const tenantRepository: MockService<Tenant> = createMockService(tenants)
export const leaseRepository: MockService<LeaseContract> = createMockService(leases)
export const receivableRepository: MockService<Receivable> = createMockService(receivables)
export const paymentRepository: MockService<Payment> = createMockService(payments)
export const expenseRepository: MockService<Expense> = createMockService(expenses)
export const settlementRepository: MockService<OwnerSettlement> = createMockService(settlements)
export const maintenanceRepository: MockService<MaintenanceRequest> = createMockService(maintenanceRequests)
export const reminderRepository: MockService<Reminder> = createMockService(remindersData)
export const notificationRepository: MockService<Notification> = createMockService(notificationsData)
export const documentTemplateRepository: MockService<DocumentTemplate> = createMockService(documentTemplatesData)
export const attachmentRepository: MockService<Attachment> = createMockService(attachmentsData)
