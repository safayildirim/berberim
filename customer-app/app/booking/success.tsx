import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check, CalendarClock, UserCircle } from 'lucide-react-native';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/src/components/common/Screen';
import { useAppointmentDetail } from '@/src/hooks/queries/useAppointments';
import { format, parseISO } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';

export default function BookingSuccessScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: appointment, isLoading } = useAppointmentDetail(id);
  const dateLocale = i18n.language.startsWith('tr') ? tr : enUS;

  const mockUUID =
    id?.toUpperCase() ||
    Math.random().toString(36).substring(2, 10).toUpperCase();

  if (isLoading) return null;

  return (
    <Screen style={{ backgroundColor: colors.background }} transparentStatusBar>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Checkmark Icon Overlay */}
        <View style={styles.heroSection}>
          <View
            style={[
              styles.checkCircle,
              {
                backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4',
                borderColor: colors.background,
              },
            ]}
          >
            <Check size={40} color="#22c55e" strokeWidth={3} />
          </View>
          <Typography
            variant="h1"
            style={[styles.heroTitle, { color: colors.text }]}
          >
            {t('booking.successTitle')}
          </Typography>
          <Typography variant="body" style={styles.heroSubtitle}>
            {t('booking.successSubtitle')}
          </Typography>
        </View>

        {/* Confirmation Card */}
        <View
          style={[
            styles.mainCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <View>
              <Typography variant="caption" style={styles.cardLabel}>
                {t('booking.reservationId', { id: '' })
                  .split(':')[0]
                  .trim()
                  .toUpperCase()}
              </Typography>
              <Typography
                variant="label"
                style={{ fontWeight: '800', color: colors.text }}
              >
                {mockUUID}
              </Typography>
            </View>
          </View>

          <View
            style={[styles.divider, { backgroundColor: colors.outlineVariant }]}
          />

          <View style={styles.infoRow}>
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: isDark
                    ? 'rgba(245, 158, 11, 0.1)'
                    : '#fffbeb',
                  borderColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7',
                },
              ]}
            >
              <CalendarClock size={24} color="#f59e0b" />
            </View>
            <View>
              <Typography
                variant="h3"
                style={[styles.infoTitle, { color: colors.text }]}
              >
                {appointment
                  ? format(parseISO(appointment.starts_at), 'EEEE, MMM d', {
                      locale: dateLocale,
                    })
                  : '...'}
              </Typography>
              <Typography
                variant="caption"
                style={{ color: colors.onSurfaceVariant }}
              >
                {appointment
                  ? format(parseISO(appointment.starts_at), 'HH:mm')
                  : '...'}
              </Typography>
            </View>
          </View>

          <View
            style={[
              styles.divider,
              { backgroundColor: colors.outlineVariant, marginVertical: 20 },
            ]}
          />

          <View style={styles.staffRow}>
            {appointment?.staff ? (
              <Image
                source={{
                  uri:
                    appointment.staff.avatar ||
                    'https://images.unsplash.com/photo-1618077360395-f3068be8e001?w=200',
                }}
                style={styles.avatar}
              />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: isDark ? '#18181b' : '#f4f4f5' },
                ]}
              >
                <UserCircle size={20} color="#71717a" />
              </View>
            )}
            <View>
              <Typography
                variant="label"
                style={{ fontWeight: '800', color: colors.text }}
              >
                {appointment?.staff
                  ? `${appointment.staff.first_name} ${appointment.staff.last_name}`
                  : t('booking.anyAvailable')}
              </Typography>
              {appointment?.staff && (
                <Typography
                  variant="caption"
                  style={{ color: colors.onSurfaceVariant }}
                >
                  {appointment.staff.specialty || t('booking.barber')}
                </Typography>
              )}
            </View>
          </View>

          <View
            style={[
              styles.divider,
              { backgroundColor: colors.outlineVariant, marginVertical: 20 },
            ]}
          />

          <View style={styles.servicesList}>
            {appointment?.services.map((srv, i) => (
              <View key={i} style={styles.serviceItem}>
                <Typography
                  variant="label"
                  style={{ color: colors.onSurfaceVariant }}
                >
                  {srv.service_name}
                </Typography>
                <Typography
                  variant="label"
                  style={{ fontWeight: '800', color: colors.text }}
                >
                  {srv.price} TL
                </Typography>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/appointments')}
            style={[
              styles.secondaryButton,
              { backgroundColor: isDark ? '#18181b' : '#f4f4f5' },
            ]}
          >
            <Typography
              variant="label"
              style={[styles.secondaryBtnText, { color: colors.text }]}
            >
              {t('booking.viewAppointmentsAction')}
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            style={styles.primaryButton}
          >
            <Typography variant="label" style={styles.primaryBtnText}>
              {t('booking.backToHome')}
            </Typography>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20, paddingBottom: 60, paddingTop: 80 },
  heroSection: { alignItems: 'center', marginBottom: 32 },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: '#71717a',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  mainCard: {
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    marginBottom: 40,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#71717a',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 1,
  },
  divider: { height: 1, width: '100%', marginVertical: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: { fontSize: 16, fontWeight: '800' },
  staffRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servicesList: { gap: 12 },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: { gap: 12 },
  primaryButton: {
    backgroundColor: '#f59e0b',
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: { color: '#000', fontWeight: '900', fontSize: 16 },
  secondaryButton: {
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { fontWeight: '800', fontSize: 16 },
});
