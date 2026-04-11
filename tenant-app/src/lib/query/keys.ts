import { AppointmentStatus, UserRole } from '@/src/types';

export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
    tenant: (tenantId: string) => ['auth', 'tenant', tenantId] as const,
  },
  appointments: {
    list: (status?: AppointmentStatus, date?: string) =>
      ['appointments', 'list', { status, date }] as const,
    detail: (id: string) => ['appointments', 'detail', id] as const,
    customer: (customerId: string) =>
      ['appointments', 'customer', customerId] as const,
    staff: (staffId: string) => ['appointments', 'staff', staffId] as const,
  },
  customers: {
    list: (search?: string) => ['customers', 'list', { search }] as const,
    detail: (id: string) => ['customers', 'detail', id] as const,
  },
  services: {
    list: () => ['services', 'list'] as const,
    detail: (id: string) => ['services', 'detail', id] as const,
  },
  staff: {
    list: (role?: UserRole) => ['staff', 'list', { role }] as const,
    detail: (id: string) => ['staff', 'detail', id] as const,
    schedule: (id: string) => ['staff', 'schedule', id] as const,
    scheduleBreaks: (id: string) => ['staff', 'scheduleBreaks', id] as const,
    timeOff: (id: string) => ['staff', 'timeOff', id] as const,
    reviews: (id: string, page?: number) =>
      ['staff', 'reviews', id, { page }] as const,
  },
  availabilitySettings: {
    detail: () => ['availabilitySettings'] as const,
  },
  loyalty: {
    settings: () => ['loyalty', 'settings'] as const,
    rewards: () => ['loyalty', 'rewards'] as const,
    redemptions: (customerId?: string) =>
      ['loyalty', 'redemptions', { customerId }] as const,
  },
  campaigns: {
    list: () => ['campaigns', 'list'] as const,
    detail: (id: string) => ['campaigns', 'detail', id] as const,
  },
  analytics: {
    overview: (range: 'daily' | 'weekly' | 'monthly') =>
      ['analytics', 'overview', range] as const,
    cohorts: (monthsBack: number) =>
      ['analytics', 'cohorts', monthsBack] as const,
    retention: (range: string) => ['analytics', 'retention', range] as const,
    ltv: (segmentBy: string) => ['analytics', 'ltv', segmentBy] as const,
    noShows: (range: string) => ['analytics', 'no-shows', range] as const,
  },
  logs: {
    audit: () => ['logs', 'audit'] as const,
    notifications: () => ['logs', 'notifications'] as const,
  },
};
