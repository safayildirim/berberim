import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { queryKeys } from '@/src/lib/query/keys';
import { tenantService } from '@/src/services/tenant.service';

export function useAppointmentActions(appointmentId: string) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.appointments.detail(appointmentId),
    });
  };

  const completeMutation = useMutation({
    mutationFn: () => tenantService.markCompleted(appointmentId),
    onSuccess: () => {
      invalidate();
      Alert.alert(t('common.done'), t('appointmentDetail.messages.completed'));
    },
  });

  const paymentMutation = useMutation({
    mutationFn: () => tenantService.markPaymentReceived(appointmentId),
    onSuccess: () => {
      invalidate();
      Alert.alert(
        t('common.done'),
        t('appointmentDetail.messages.paymentReceived'),
      );
    },
  });

  const noShowMutation = useMutation({
    mutationFn: () => tenantService.markNoShow(appointmentId),
    onSuccess: () => {
      invalidate();
      Alert.alert(t('common.done'), t('appointmentDetail.messages.noShow'));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => tenantService.cancelAppointment(appointmentId),
    onSuccess: () => {
      invalidate();
      Alert.alert(t('common.done'), t('appointmentDetail.messages.cancelled'));
      router.back();
    },
  });

  return {
    markCompleted: completeMutation.mutate,
    isCompleting: completeMutation.isPending,
    markPaymentReceived: paymentMutation.mutate,
    isPaying: paymentMutation.isPending,
    markNoShow: noShowMutation.mutate,
    isMarkingNoShow: noShowMutation.isPending,
    cancelBooking: cancelMutation.mutate,
    isCancelling: cancelMutation.isPending,
  };
}
