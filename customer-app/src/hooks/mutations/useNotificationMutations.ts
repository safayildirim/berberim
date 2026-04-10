import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/src/lib/api/client';
import { queryKeys } from '@/src/lib/query/keys';

export const useNotificationMutations = () => {
  const queryClient = useQueryClient();

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      // Endpoint expectation: PATCH /api/v1/customer/notifications/read-all
      return await api.patch('/customer/notifications/read-all', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customer.notifications,
      });
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      return await api.patch(`/customer/notifications/${id}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customer.notifications,
      });
    },
  });

  return {
    markAllAsRead,
    markAsRead,
  };
};
