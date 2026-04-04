import { api } from '@/src/lib/api/client';
import { StaffReview } from '@/src/types';

export interface CreateReviewRequest {
  appointment_id: string;
  rating: number;
  comment?: string;
  is_anonymous: boolean;
}

export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
  is_anonymous?: boolean;
}

export const reviewService = {
  create: async (data: CreateReviewRequest): Promise<StaffReview> => {
    return api
      .post<{ review: StaffReview }>('/customer/reviews', data)
      .then((res) => res.review);
  },

  update: async (
    id: string,
    data: UpdateReviewRequest,
  ): Promise<StaffReview> => {
    return api
      .patch<{ review: StaffReview }>(`/customer/reviews/${id}`, data)
      .then((res) => res.review);
  },

  remove: async (id: string): Promise<void> => {
    return api.delete(`/customer/reviews/${id}`);
  },

  getForAppointment: async (
    appointmentId: string,
  ): Promise<StaffReview | null> => {
    return api
      .get<{
        review: StaffReview | null;
      }>(`/customer/appointments/${appointmentId}/review`)
      .then((res) => res.review);
  },
};
