import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/src/lib/api/client';
import { queryKeys } from '@/src/lib/query/keys';

export const useNotificationMutations = () => {
  const queryClient = useQueryClient();

  const invalidateNotifications = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.customer.notifications,
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.customer.unreadCount,
    });
  };

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      return await api.patch('/customer/notifications/read-all', {});
    },
    onSuccess: invalidateNotifications,
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      return await api.patch(`/customer/notifications/${id}/read`, {});
    },
    onSuccess: invalidateNotifications,
  });

  return {
    markAllAsRead,
    markAsRead,
  };
};
