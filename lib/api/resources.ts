export const apiResources = {
  owners: '/owners', managementContracts: '/management-contracts', properties: '/properties', units: '/units', tenants: '/tenants', leases: '/leases', receivables: '/receivables', payments: '/payments', expenses: '/expenses', maintenance: '/maintenance-requests', settlements: '/owner-settlements', reminders: '/reminders', notifications: '/notifications', documents: '/documents', reports: '/reports', settings: '/settings',
} as const
export type ApiResourceKey = keyof typeof apiResources
