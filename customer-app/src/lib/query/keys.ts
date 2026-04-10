export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
    session: ['auth', 'session'] as const,
  },
  tenant: {
    config: (slug: string) => ['tenant', 'config', slug],
  },
  customer: {
    profile: ['customer', 'profile'] as const,
    notifications: ['customer', 'notifications'] as const,
    unreadCount: ['customer', 'notifications', 'unread-count'] as const,
  },
  services: {
    list: (category?: string) => ['services', 'list', category].filter(Boolean),
    detail: (id: string) => ['services', 'detail', id],
  },
  staff: {
    list: ['staff', 'list'] as const,
    detail: (id: string) => ['staff', 'detail', id],
  },
  availability: {
    search: (params: any) => ['availability', 'search', params],
    days: (params: any) => ['availability', 'days', params],
    recommendations: (params: any) => [
      'availability',
      'recommendations',
      params,
    ],
  },
  appointments: {
    all: ['appointments'] as const,
    list: (status?: string) => ['appointments', 'list', status].filter(Boolean),
    detail: (id: string) => ['appointments', 'detail', id],
    bookingLimit: ['appointments', 'bookingLimit'] as const,
  },
  loyalty: {
    wallet: ['loyalty', 'wallet'] as const,
    transactions: ['loyalty', 'transactions'] as const,
    rewards: ['loyalty', 'rewards'] as const,
  },
  campaigns: {
    all: ['campaigns'] as const,
    list: ['campaigns', 'list'] as const,
    detail: (id: string) => ['campaigns', 'detail', id],
  },
  reviews: {
    forAppointment: (id: string) => ['reviews', 'forAppointment', id],
  },
};
