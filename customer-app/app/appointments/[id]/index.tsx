import { AddReviewCard } from '@/src/components/appointments/LeaveReviewCard';
import { format, parseISO } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Clock, Compass } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocationMap } from '@/src/components/common/LocationMap';
import { Screen } from '@/src/components/common/Screen';
import { StaffAvatar } from '@/src/components/common/StaffAvatar';
import { MyReviewSection } from '@/src/components/reviews/MyReviewSection';
import { Button, Typography } from '@/src/components/ui';
import { COLORS, SHADOWS, SIZES } from '@/src/constants/theme';
import {
  useCancelAppointment,
  useRebookAppointment,
} from '@/src/hooks/mutations/useAppointmentMutations';
import { useDeleteReview } from '@/src/hooks/mutations/useReviewMutations';
import { useAppointmentDetail } from '@/src/hooks/queries/useAppointments';
import { useMyReview } from '@/src/hooks/queries/useReviews';
import { useTenantStore } from '@/src/store/useTenantStore';

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { config, getBranding } = useTenantStore();
  const { primaryColor } = getBranding();
  const insets = useSafeAreaInsets();

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

  const handleRebook = async () => {
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

  if (!appointment && !isLoading) {
    return <Screen empty emptyTitle={t('appointments.appointmentNotFound')} />;
  }

  const startTime = appointment ? parseISO(appointment.starts_at) : new Date();
  const totalDuration =
    appointment?.services.reduce(
      (acc, s) => acc + (s.duration_minutes || 0),
      0,
    ) || 0;

  const statusConfig = {
    confirmed: {
      color: COLORS.success,
      bg: COLORS.success + '20',
      label: t('appointments.status.confirmed'),
    },
    payment_received: {
      color: COLORS.success,
      bg: COLORS.success + '20',
      label: t('appointments.status.payment_received'),
    },
    completed: {
      color: COLORS.secondary,
      bg: COLORS.secondary + '20',
      label: t('appointments.status.completed'),
    },
    cancelled: {
      color: COLORS.error,
      bg: COLORS.error + '20',
      label: t('appointments.status.cancelled'),
    },
    no_show: {
      color: COLORS.error,
      bg: COLORS.error + '20',
      label: t('appointments.status.no_show'),
    },
    rescheduled: {
      color: COLORS.warning,
      bg: COLORS.warning + '20',
      label: t('appointments.status.rescheduled'),
    },
    pending: {
      color: COLORS.onSurfaceVariant,
      bg: COLORS.onSurfaceVariant + '20',
      label: t('appointments.status.pending'),
    },
  }[appointment?.status || 'confirmed'] || {
    color: COLORS.secondary,
    bg: COLORS.secondary + '20',
    label: t(`appointments.status.${appointment?.status || 'pending'}`),
  };

  return (
    <Screen
      headerTitle={t('appointments.details')}
      loading={isLoading}
      error={error}
      style={styles.container}
      transparentStatusBar
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, SIZES.padding) + SIZES.xl },
        ]}
      >
        {/* Status Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: primaryColor }]}>
          <View style={styles.heroContent}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: 'rgba(255,255,255,0.2)' },
              ]}
            >
              <Typography variant="caption" style={styles.statusBadgeText}>
                {statusConfig.label.toUpperCase()}
              </Typography>
            </View>

            <Typography variant="h1" style={styles.heroTitle}>
              {appointment?.services[0]?.service_name || 'Grooming Session'}
            </Typography>

            <Typography variant="body" style={styles.heroSubtitle}>
              {format(startTime, 'EEEE, MMM d', { locale: dateLocale })} •{' '}
              {format(startTime, 'HH:mm')}
            </Typography>

            <View style={styles.barberSnapshot}>
              <StaffAvatar
                staff={appointment?.staff}
                size={48}
                style={styles.heroAvatar}
              />
              <View>
                <Typography variant="caption" style={styles.heroBarberLabel}>
                  {appointment?.staff?.role || 'Master Barber'}
                </Typography>
                <Typography variant="h3" style={styles.heroBarberName}>
                  {appointment?.staff
                    ? `${appointment.staff.first_name} ${appointment.staff.last_name}`
                    : '---'}
                </Typography>
              </View>
            </View>
          </View>
          {/* Decorative element */}
          <View style={styles.heroDecoration} />
        </View>

        {/* Info Grid (Bento Style) */}
        <View style={styles.bentoGrid}>
          <View style={styles.summaryCard}>
            <Typography variant="h3" style={styles.cardTitle}>
              {t('appointments.summary')}
            </Typography>

            <View style={styles.serviceList}>
              {appointment?.services.map((service, index) => (
                <View key={index} style={styles.serviceRow}>
                  <View style={{ flex: 1 }}>
                    <Typography variant="body" style={styles.serviceNameText}>
                      {service.service_name}
                    </Typography>
                    <Typography variant="caption" color={COLORS.secondary}>
                      {service.duration_minutes} {t('booking.minutes')}
                    </Typography>
                  </View>
                  <Typography variant="body" style={styles.servicePriceText}>
                    {service.price} TL
                  </Typography>
                </View>
              ))}
            </View>

            <View style={styles.summaryFooter}>
              <Typography variant="h3">
                {t('appointments.totalLabel')}
              </Typography>
              <Typography variant="h2" color={primaryColor}>
                {appointment?.total_price || '0'} TL
              </Typography>
            </View>
          </View>

          {/* Duration Card */}
          <View style={styles.durationCard}>
            <View style={{ flexDirection: 'column' }}>
              <Typography variant="h3" style={styles.durationLabel}>
                {t('booking.durationLabel')}
              </Typography>
              <Typography variant="h1" style={styles.durationValue}>
                {totalDuration}
              </Typography>
              <Typography variant="caption" style={styles.durationUnit}>
                {t('booking.minutes').toUpperCase()}
              </Typography>
            </View>
            <View style={styles.clockIconCircle}>
              <Clock size={20} color={COLORS.white} strokeWidth={2.5} />
            </View>
          </View>
        </View>

        <View style={styles.locationSection}>
          <LocationMap
            latitude={config?.coordinates?.latitude || 41.0082}
            longitude={config?.coordinates?.longitude || 28.9784}
            title={config?.name}
            pinColor={primaryColor}
            style={styles.mapContainer}
          />

          <View style={styles.locationContent}>
            <View style={{ flex: 1 }}>
              <Typography variant="h3" style={styles.atelierName}>
                {config?.name}
              </Typography>
              <Typography
                variant="caption"
                color={COLORS.secondary}
                style={styles.atelierAddress}
              >
                {config?.address}
              </Typography>
            </View>
            <TouchableOpacity
              style={[
                styles.directionsButton,
                { backgroundColor: primaryColor },
              ]}
            >
              <Compass size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* My Review Section */}
        {review ? (
          <MyReviewSection
            review={review}
            onEdit={() => router.push(`/appointments/${id}/review`)}
            onDelete={handleDeleteReview}
          />
        ) : (
          appointment?.status === 'completed' && (
            <AddReviewCard
              appointmentId={id as string}
              staffName={appointment?.staff?.first_name!}
              onSuccess={() => {
                // Success is handled by mutation invalidation
              }}
            />
          )
        )}

        {/* Action Buttons */}
        <View style={styles.footerActions}>
          {appointment?.status === 'completed' && (
            <Button
              title={t('appointments.rebookThisExperience')}
              onPress={handleRebook}
              variant="primary"
              size="lg"
              style={styles.rebookButton}
            />
          )}
          {appointment?.status !== 'completed' &&
            appointment?.status !== 'cancelled' &&
            appointment?.status !== 'no_show' && (
              <Button
                title={t('appointments.cancelAppointment')}
                onPress={handleCancel}
                variant="ghost"
                loading={isCancelling}
                titleStyle={styles.cancelButtonText}
                style={styles.cancelButton}
              />
            )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 0,
  },
  scrollContent: {
    paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.xl * 2,
  },
  heroCard: {
    borderRadius: 32,
    padding: 24,
    marginTop: SIZES.md,
    marginBottom: 24,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  heroContent: {
    zIndex: 10,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    marginBottom: 16,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -1,
    marginBottom: 8,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginBottom: 24,
  },
  barberSnapshot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  heroAvatar: {
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroBarberLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  heroBarberName: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
  heroDecoration: {
    position: 'absolute',
    right: -40,
    bottom: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  bentoGrid: {
    flexDirection: 'column',
    gap: 16,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 2,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 32,
    padding: 24,
  },
  cardTitle: {
    marginBottom: 20,
    fontSize: 18,
    fontWeight: '800',
  },
  serviceList: {
    gap: 16,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serviceNameText: {
    fontWeight: '700',
    marginBottom: 2,
  },
  servicePriceText: {
    fontWeight: '800',
    color: COLORS.text,
  },
  summaryFooter: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationCard: {
    flex: 1,
    borderRadius: 32,
    padding: 32,
    backgroundColor: '#EBE7E6',
    justifyContent: 'space-between',
    gap: 16,
  },
  durationLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: '#5F5E5E',
    marginBottom: 10,
  },
  durationValue: {
    fontSize: 44,
    fontWeight: '900',
    lineHeight: 44,
    color: COLORS.text,
  },
  durationUnit: {
    fontSize: 14,
    fontWeight: '800',
    color: '#868382',
    letterSpacing: 1,
    marginTop: -4,
  },
  clockIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#868382',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationSection: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 24,
  },
  mapContainer: {
    height: 160,
  },
  locationContent: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  atelierName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  atelierAddress: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  directionsButton: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  footerActions: {
    gap: 12,
  },
  rebookButton: {
    height: 64,
    borderRadius: 20,
  },
  cancelButton: {
    height: 64,
    backgroundColor: 'rgba(186, 26, 26, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.1)',
    borderRadius: 20,
  },
  cancelButtonText: {
    color: '#BA1A1A',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
