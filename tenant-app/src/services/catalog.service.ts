import { api } from '@/src/lib/api/client';
import { Service } from '@/src/types';

export interface CreateServiceRequest {
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  points_reward: number;
}

export interface UpdateServiceRequest extends Partial<CreateServiceRequest> {
  is_active?: boolean;
}

export const catalogService = {
  list: async (params?: { is_active?: boolean }): Promise<Service[]> => {
    return api.get('/staff/services', { params });
  },

  detail: async (id: string): Promise<Service> => {
    return api.get(`/staff/services/${id}`);
  },

  create: async (data: CreateServiceRequest): Promise<Service> => {
    return api.post('/staff/services', data);
  },

  update: async (id: string, data: UpdateServiceRequest): Promise<Service> => {
    return api.patch(`/staff/services/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    return api.delete(`/staff/services/${id}`);
  },
};
