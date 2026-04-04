import { format } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Home,
} from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/src/components/common/Screen';
import { StaffAvatar } from '@/src/components/common/StaffAvatar';
import { Button, Typography } from '@/src/components/ui';
import { COLORS, SIZES } from '@/src/constants/theme';
import { useAppointmentDetail } from '@/src/hooks/queries/useAppointments';
import { useTenantStore } from '@/src/store/useTenantStore';

export default function BookingSuccessScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const { getBranding } = useTenantStore();
  const { primaryColor } = getBranding();
  const dateLocale = i18n.language === 'tr' ? tr : enUS;

  const { data: appointment, isLoading } = useAppointmentDetail(appointmentId);

  const handleHome = () => {
    router.replace('/(tabs)');
  };

  const handleAppointments = () => {
    router.replace('/(tabs)/appointments');
  };

  if (isLoading) {
    return (
      <Screen style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      </Screen>
    );
  }

  const startTime = appointment ? new Date(appointment.starts_at) : new Date();

  return (
    <Screen style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, SIZES.padding) + SIZES.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <CheckCircle2 size={80} color={COLORS.success} />
          <Typography variant="h1" style={styles.heroTitle}>
            {t('booking.successTitle')}
          </Typography>
          <Typography
            variant="body"
            color={COLORS.secondary}
            style={styles.heroSubtitle}
          >
            {t('booking.successSubtitle')}
          </Typography>
        </View>

        <View style={styles.mainCard}>
          <View style={styles.headerRow}>
            <View>
              <Typography variant="caption" style={styles.sectionLabel}>
                {t(
                  'booking.reservationIdLabel',
                  'RESERVATION ID',
                ).toUpperCase()}
              </Typography>
              <Typography variant="h3" style={styles.reservationId}>
                #{appointmentId ? appointmentId.slice(-8).toUpperCase() : '---'}
              </Typography>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: COLORS.success + '20' },
              ]}
            >
              <Typography
                variant="caption"
                style={{ color: COLORS.success, fontWeight: '700' }}
              >
                {t('booking.statusConfirmed', 'CONFIRMED').toUpperCase()}
              </Typography>
            </View>
          </View>

          <View style={styles.divider} />

          {/* DateTime Section */}
          <View style={styles.infoGrid}>
            <View style={styles.gridItem}>
              <View style={styles.iconContainer}>
                <Calendar size={20} color={primaryColor} />
              </View>
              <View>
                <Typography variant="caption" style={styles.gridLabel}>
                  {t('booking.dateLabel').toUpperCase()}
                </Typography>
                <Typography variant="h3" style={styles.gridValue}>
                  {format(startTime, 'EEEE, MMM d', { locale: dateLocale })}
                </Typography>
              </View>
            </View>

            <View style={styles.gridItem}>
              <View style={styles.iconContainer}>
                <Clock size={20} color={primaryColor} />
              </View>
              <View>
                <Typography variant="caption" style={styles.gridLabel}>
                  {t('booking.timeLabel').toUpperCase()}
                </Typography>
                <Typography variant="h3" style={styles.gridValue}>
                  {format(startTime, 'HH:mm')}
                </Typography>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Staff Section */}
          <View style={styles.staffSection}>
            <Typography variant="caption" style={styles.sectionLabel}>
              {t('booking.staffLabel').toUpperCase()}
            </Typography>
            <View style={styles.staffRow}>
              <StaffAvatar
                staff={appointment?.staff}
                size={56}
                style={styles.avatar}
              />
              <View>
                <Typography variant="h3" style={styles.staffName}>
                  {appointment?.staff
                    ? `${appointment.staff.first_name} ${appointment.staff.last_name}`
                    : '---'}
                </Typography>
                <Typography variant="caption" color={COLORS.secondary}>
                  {appointment?.staff?.specialty || 'Barber'}
                </Typography>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Services Section */}
          <View style={styles.servicesSection}>
            <Typography variant="caption" style={styles.sectionLabel}>
              {t('booking.servicesLabel').toUpperCase()}
            </Typography>
            <View style={styles.servicesList}>
              {appointment?.services.map((service, index) => (
                <View key={index} style={styles.serviceItem}>
                  <Typography variant="body" style={styles.serviceName}>
                    {service.service_name}
                  </Typography>
                  <Typography variant="body" style={styles.servicePrice}>
                    {service.price} TL
                  </Typography>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={t('booking.viewAppointmentsAction')}
            onPress={handleAppointments}
            variant="outline"
            size="lg"
            style={styles.secondaryButton}
            titleStyle={{ color: COLORS.text }}
            icon={<ArrowRight size={20} color={COLORS.text} />}
          />
          <Button
            title={t('booking.backToHome')}
            onPress={handleHome}
            variant="primary"
            size="lg"
            style={styles.primaryButton}
            icon={<Home size={20} color={COLORS.white} />}
          />
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.md,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -2,
    lineHeight: 44,
    color: COLORS.text,
    marginTop: SIZES.md,
    marginBottom: SIZES.xs,
    textAlign: 'center',
  },
  heroSubtitle: {
    textAlign: 'center',
    paddingHorizontal: SIZES.xl,
  },
  mainCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 40,
    padding: 32,
    marginBottom: SIZES.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sectionLabel: {
    letterSpacing: 2,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 8,
  },
  reservationId: {
    fontSize: 20,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 24,
    opacity: 0.5,
  },
  infoGrid: {
    flexDirection: 'column',
    gap: 32,
  },
  gridItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLabel: {
    letterSpacing: 1,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  gridValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  staffSection: {},
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 20,
  },
  staffName: {
    fontSize: 18,
    fontWeight: '700',
  },
  servicesSection: {},
  servicesList: {
    gap: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: {
    fontWeight: '600',
  },
  servicePrice: {
    fontWeight: '700',
    color: COLORS.text,
  },
  buttonContainer: {
    gap: SIZES.md,
  },
  primaryButton: {
    height: 64,
    borderRadius: 24,
  },
  secondaryButton: {
    height: 64,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 0,
  },
});
