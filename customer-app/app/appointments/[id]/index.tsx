import { AddReviewCard } from '@/src/components/appointments/LeaveReviewCard';
import { format, parseISO } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, View, Linking } from 'react-native';
import { Screen } from '@/src/components/common/Screen';
import { MyReviewSection } from '@/src/components/reviews/MyReviewSection';
import {
  useCancelAppointment,
  useRebookAppointment,
} from '@/src/hooks/mutations/useAppointmentMutations';
import { useDeleteReview } from '@/src/hooks/mutations/useReviewMutations';
import { useAppointmentDetail } from '@/src/hooks/queries/useAppointments';
import { useMyReview } from '@/src/hooks/queries/useReviews';
import { useTheme } from '@/src/store/useThemeStore';
import { AppointmentStatusBanner } from '@/src/components/appointments/AppointmentStatusBanner';
import { ShopInfoCard } from '@/src/components/appointments/ShopInfoCard';
import { AppointmentServiceCard } from '@/src/components/appointments/AppointmentServiceCard';
import { PolicyInfoCard } from '@/src/components/appointments/PolicyInfoCard';
import { AppointmentStickyActions } from '@/src/components/appointments/AppointmentStickyActions';

import { useTenantStore } from '@/src/store/useTenantStore';

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const tenant = useTenantStore((state) => state.config);

  const {
    data: appointment,
    isLoading,
    error,
  } = useAppointmentDetail(id as string);

  const dateLocale = i18n.language.startsWith('tr') ? tr : enUS;

  const { mutate: cancelAppointment, isPending: isCancelling } =
    useCancelAppointment();
  const { mutateAsync: rebook } = useRebookAppointment();

  const { data: review } = useMyReview(id as string);
  const { mutate: deleteReview } = useDeleteReview();

  const handleCancel = () => {
    Alert.alert(
      t('appointments.cancelConfirmTitle'),
      t('appointments.cancelConfirmMsg'),
      [
        { text: t('appointments.cancelNo'), style: 'cancel' },
        {
          text: t('appointments.cancelYes'),
          style: 'destructive',
          onPress: () =>
            cancelAppointment(id as string, {
              onSuccess: () => {
                Alert.alert(
                  t('common.done'),
                  t('appointments.cancelSuccessMsg'),
                );
                router.back();
              },
            }),
        },
      ],
    );
  };

  const handleReschedule = async () => {
    await rebook(id as string);
    router.push('/booking/slots');
  };

  const handleDeleteReview = () => {
    if (!review) return;
    Alert.alert(
      t('reviews.delete_confirm_title'),
      t('reviews.delete_confirm_msg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () =>
            deleteReview(
              { id: review.id, appointmentId: id as string },
              {
                onSuccess: () => {
                  Alert.alert(t('common.done'), t('reviews.delete_success'));
                },
              },
            ),
        },
      ],
    );
  };

  const handleCall = () => {
    if (tenant?.phone_number) {
      Linking.openURL(`tel:${tenant.phone_number}`);
    } else {
      Alert.alert(t('common.error'), 'Shop phone number not available');
    }
  };

  const handleDirections = () => {
    if (tenant?.coordinates) {
      const { latitude, longitude } = tenant.coordinates;
      const url = `http://maps.apple.com/?daddr=${latitude},${longitude}&q=${encodeURIComponent(tenant.name || 'Barber Shop')}`;
      Linking.openURL(url);
    }
  };

  if (!appointment && !isLoading) {
    return <Screen empty emptyTitle={t('appointments.appointmentNotFound')} />;
  }

  const startTime = appointment ? parseISO(appointment.starts_at) : new Date();
  const serviceNames =
    appointment?.services.map((s) => s.service_name).join(', ') || '---';
  const totalDuration =
    appointment?.services.reduce(
      (acc, s) => acc + (s.duration_minutes || 0),
      0,
    ) || 0;

  return (
    <View style={styles.root}>
      <Screen
        headerTitle={t('appointments.details')}
        showHeaderBack={true}
        loading={isLoading}
        error={error}
        style={{ backgroundColor: colors.background }}
        transparentStatusBar
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {appointment && (
            <>
              <AppointmentStatusBanner status={appointment.status} />

              <ShopInfoCard
                shopName={tenant?.name || '---'}
                shopImage={tenant?.branding?.logo_url}
                barberName={
                  appointment.staff
                    ? `${appointment.staff.first_name} ${appointment.staff.last_name}`
                    : '---'
                }
                address={tenant?.address || '---'}
                latitude={tenant?.coordinates?.latitude}
                longitude={tenant?.coordinates?.longitude}
                onCall={handleCall}
                onDirections={handleDirections}
              />

              <AppointmentServiceCard
                serviceName={serviceNames}
                price={`${appointment.total_price} TL`}
                date={format(startTime, 'EEEE, MMM d • HH:mm', {
                  locale: dateLocale,
                })}
                duration={`${totalDuration} min`}
              />

              <PolicyInfoCard />

              {/* My Review Section */}
              {review ? (
                <MyReviewSection
                  review={review}
                  onEdit={() => router.push(`/appointments/${id}/review`)}
                  onDelete={handleDeleteReview}
                />
              ) : (
                appointment.status === 'completed' && (
                  <AddReviewCard
                    appointmentId={id as string}
                    staffName={appointment.staff?.first_name!}
                    onSuccess={() => {}}
                  />
                )
              )}
            </>
          )}
        </ScrollView>
      </Screen>

      {appointment && (
        <AppointmentStickyActions
          status={appointment.status}
          onReschedule={handleReschedule}
          onCancel={handleCancel}
          isCancelling={isCancelling}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
});
