import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { History, LayoutDashboard } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SHADOWS, TYPOGRAPHY } from '@/src/constants/theme';
import { Appointment } from '@/src/types';
import { useTheme } from '@/src/hooks/useTheme';

interface Props {
  appointment?: Appointment;
  primaryColor?: string;
}

export const DashboardNextAppointment: React.FC<Props> = ({
  appointment,
  primaryColor,
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const finalPrimaryColor = primaryColor || colors.primary;

  if (!appointment) {
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          {t('dashboard.noUpcoming')}
        </Text>
        <View
          style={[
            styles.featuredCard,
            styles.emptyFeatured,
            {
              backgroundColor: colors.surfaceContainerLow,
              borderColor: colors.border + '15',
            },
          ]}
        >
          <LayoutDashboard size={40} color={colors.outline} strokeWidth={1.5} />
          <Text style={[styles.emptyFeaturedText, { color: colors.secondary }]}>
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
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>
        {t('dashboard.nextUpcoming')}
      </Text>
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.featuredCard}
        onPress={() => router.push(`/appointments/${appointment.id}`)}
      >
        <LinearGradient
          colors={[
            finalPrimaryColor,
            isDark ? colors.surfaceContainerHigh : finalPrimaryColor + 'D9',
          ]}
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
                  style={[
                    styles.avatar,
                    { borderColor: 'rgba(255,255,255,0.3)' },
                  ]}
                />
                <View
                  style={[
                    styles.onlineIndicator,
                    {
                      backgroundColor: colors.success,
                      borderColor: finalPrimaryColor,
                    },
                  ]}
                />
              </View>
              <View>
                <Text style={[styles.featuredName, { color: colors.white }]}>
                  {appointment.customer?.first_name || 'N/A'}{' '}
                  {appointment.customer?.last_name || ''}
                </Text>
                <Text
                  style={[
                    styles.featuredService,
                    { color: 'rgba(255,255,255,0.7)' },
                  ]}
                  numberOfLines={1}
                >
                  {appointment.services
                    .map((s) => s.service_name || s.name)
                    .join(' + ')}
                </Text>
              </View>
            </View>

            <View style={styles.featuredTimeBlock}>
              <View style={styles.timeInfo}>
                <Text style={styles.timeLabel}>
                  {t('dashboard.time').toUpperCase()}
                </Text>
                <Text style={[styles.timeValue, { color: colors.white }]}>
                  {format(new Date(appointment.starts_at), 'HH:mm')}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.timeInfo}>
                <Text style={styles.timeLabel}>
                  {t('dashboard.duration').toUpperCase()}
                </Text>
                <Text style={[styles.timeValue, { color: colors.white }]}>
                  {duration}m
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.featuredFooter}>
            <View style={styles.returningBadge}>
              <History size={12} color={colors.white} />
              <Text style={[styles.returningText, { color: colors.white }]}>
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
    ...TYPOGRAPHY.h3,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  featuredCard: {
    borderRadius: 24,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  featuredGradient: {
    padding: 24,
  },
  featuredHeader: {
    flexDirection: 'column',
    gap: 16,
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
    width: 60,
    height: 60,
    borderRadius: 18,
    borderWidth: 2,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
  },
  featuredName: {
    ...TYPOGRAPHY.h3,
    fontSize: 20,
    fontWeight: '800',
  },
  featuredService: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    marginTop: 2,
  },
  featuredTimeBlock: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  timeInfo: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  timeLabel: {
    ...TYPOGRAPHY.label,
    fontSize: 9,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
  },
  timeValue: {
    ...TYPOGRAPHY.h3,
    fontSize: 18,
    marginTop: 4,
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
  },
  returningText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
  },
  emptyFeatured: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
  },
  emptyFeaturedText: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
    opacity: 0.7,
  },
});
