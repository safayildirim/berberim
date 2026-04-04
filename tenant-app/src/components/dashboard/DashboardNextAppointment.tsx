import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { History, LayoutDashboard } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SHADOWS } from '@/src/constants/theme';
import { Appointment } from '@/src/types';

interface Props {
  appointment?: Appointment;
  primaryColor?: string;
}

export const DashboardNextAppointment: React.FC<Props> = ({
  appointment,
  primaryColor = COLORS.primary,
}) => {
  const { t } = useTranslation();
  const router = useRouter();

  if (!appointment) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('dashboard.noUpcoming')}</Text>
        <View style={[styles.featuredCard, styles.emptyFeatured]}>
          <LayoutDashboard
            size={40}
            color={COLORS.secondary}
            strokeWidth={1.5}
          />
          <Text style={styles.emptyFeaturedText}>
            {t('dashboard.emptyUpcoming')}
          </Text>
        </View>
      </View>
    );
  }

  const duration = appointment.services.reduce(
    (acc, s) => acc + (s.duration_minutes || 0),
    0,
  );

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('dashboard.nextUpcoming')}</Text>
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.featuredCard}
        onPress={() => router.push(`/appointments/${appointment.id}`)}
      >
        <LinearGradient
          colors={[primaryColor, COLORS.primaryContainer]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.featuredGradient}
        >
          <View style={styles.featuredHeader}>
            <View style={styles.featuredCustomer}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{
                    uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7akU3BWqR8K5f9c_mAHeu53749oHKc4FNbYF_se_Z-_1FIJjQ7d-aVo7BNnPr2kDFZer_VaizcrrpWdYQOYxBVKuHNgzBjbrUZgvye2FMvSqJ7z3XEih1HVysvTsH67IWeRXDh0M-MvDLGSY1tRZyVTblBNsBC1QNyjBfI5dhExxe_H8AqQNnc_O3yyjCBUXe4dfCAipcSp-yomEHa7u_EjcCXqmDvRtE52tLeweiVdyeouv30_YE6YNhsIWfB7uTECr-wc-F2naS',
                  }}
                  style={styles.avatar}
                />
                <View style={styles.onlineIndicator} />
              </View>
              <View>
                <Text style={styles.featuredName}>
                  {appointment.customer?.first_name || 'N/A'}{' '}
                  {appointment.customer?.last_name || ''}
                </Text>
                <Text style={styles.featuredService}>
                  {appointment.services
                    .map((s) => s.service_name || s.name)
                    .join(' + ')}
                </Text>
              </View>
            </View>

            <View style={styles.featuredTimeBlock}>
              <View style={styles.timeInfo}>
                <Text style={styles.timeLabel}>{t('dashboard.time')}</Text>
                <Text style={styles.timeValue}>
                  {format(new Date(appointment.starts_at), 'HH:mm')}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.timeInfo}>
                <Text style={styles.timeLabel}>{t('dashboard.duration')}</Text>
                <Text style={styles.timeValue}>{duration}m</Text>
              </View>
            </View>
          </View>

          <View style={styles.featuredFooter}>
            <View style={styles.returningBadge}>
              <History size={12} color={COLORS.white} />
              <Text style={styles.returningText}>
                {t('dashboard.returningClient', {
                  count: appointment.customer?.visit_count || 0,
                })}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  featuredCard: {
    borderRadius: 24,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  featuredGradient: {
    padding: 20,
  },
  featuredHeader: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20,
  },
  featuredCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  featuredName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
  },
  featuredService: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  featuredTimeBlock: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  timeInfo: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  timeLabel: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '800',
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  returningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  returningText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '600',
  },
  emptyFeatured: {
    backgroundColor: COLORS.white,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  emptyFeaturedText: {
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
});
