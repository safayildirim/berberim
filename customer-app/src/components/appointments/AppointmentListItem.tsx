import { format, parseISO } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { COLORS, SHADOWS, SIZES } from '@/src/constants/theme';
import { Appointment } from '@/src/types';
import { StaffAvatar } from '@/src/components/common/StaffAvatar';
import { StarRatingDisplay } from '@/src/components/reviews/StarRatingDisplay';
import { Typography } from '@/src/components/ui';

interface AppointmentListItemProps {
  appointment: Appointment;
  onPress?: () => void;
  onCancel?: () => void;
  onRebook?: () => void;
  onReview?: () => void;
  showActions?: boolean;
}

export const AppointmentListItem: React.FC<AppointmentListItemProps> = ({
  appointment,
  onPress,
  onCancel,
  onRebook,
  onReview,
  showActions = false,
}) => {
  const { t, i18n } = useTranslation();

  const startTime = parseISO(appointment.starts_at);
  const dateLocale = i18n.language.startsWith('tr') ? tr : enUS;

  const statusConfig = {
    confirmed: {
      bg: COLORS.secondaryContainer,
      text: COLORS.onSecondaryContainer,
    },
    payment_received: {
      bg: COLORS.secondaryContainer,
      text: COLORS.onSecondaryContainer,
    },
    completed: {
      bg: COLORS.surfaceContainerHighest,
      text: COLORS.onSurfaceVariant,
    },
    cancelled: {
      bg: COLORS.errorContainer,
      text: COLORS.error,
    },
    no_show: {
      bg: COLORS.errorContainer,
      text: COLORS.error,
    },
    rescheduled: {
      bg: COLORS.secondaryContainer,
      text: COLORS.onSecondaryContainer,
    },
    pending: {
      bg: COLORS.surfaceContainerHigh,
      text: COLORS.onSurfaceVariant,
    },
  }[appointment.status as string] || {
    bg: COLORS.surfaceContainerHigh,
    text: COLORS.onSurfaceVariant,
  };

  const serviceName = appointment.services
    .map((s) => s.service_name)
    .join(' + ');

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.mainInfo}>
          <View style={[styles.badge, { backgroundColor: statusConfig.bg }]}>
            <Typography
              variant="caption"
              style={[styles.badgeText, { color: statusConfig.text }]}
            >
              {t(`appointments.status.${appointment.status}`).toUpperCase()}
            </Typography>
          </View>
          <Typography variant="h2" style={styles.title}>
            {serviceName}
          </Typography>
        </View>
        <View style={styles.dateInfo}>
          <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.headerButton}
          >
            <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
              <Typography variant="h3" style={styles.dateText}>
                {format(startTime, 'MMM dd', {
                  locale: dateLocale,
                }).toUpperCase()}
              </Typography>
              <Typography variant="caption" style={styles.timeText}>
                {format(startTime, 'p', { locale: dateLocale })}
              </Typography>
            </View>
            <ChevronRight
              size={20}
              color={COLORS.onSurfaceVariant}
              pointerEvents="none"
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.barberSection}>
        <View style={styles.avatarContainer}>
          <StaffAvatar staff={appointment.staff} size={48} />
        </View>
        <View>
          <Typography variant="caption" style={styles.barberLabel}>
            {appointment?.staff?.specialty?.toUpperCase() || 'BARBER'}
          </Typography>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Typography variant="label" style={styles.barberName}>
              {appointment?.staff
                ? `${appointment.staff.first_name} ${appointment.staff.last_name}`
                : '---'}
            </Typography>
            {appointment.staff?.avg_rating !== undefined && (
              <StarRatingDisplay
                rating={appointment.staff.avg_rating}
                reviewCount={appointment.staff.review_count}
                size={12}
              />
            )}
          </View>
          {appointment.status === 'completed' && (
            <Typography variant="caption" color={COLORS.secondary}>
              {format(startTime, 'MMM d, h:mm a')}
            </Typography>
          )}
        </View>
      </View>

      {showActions && (
        <View style={styles.actions}>
          {appointment.status === 'completed' ? (
            <View style={{ flex: 1, gap: SIZES.sm }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onRebook}
                style={styles.rebookButton}
              >
                <Typography variant="label" style={styles.rebookText}>
                  {t('appointments.rebook')}
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onReview}
                style={styles.reviewButton}
              >
                <Typography variant="label" style={styles.reviewText}>
                  {appointment.review
                    ? t('reviews.update_review')
                    : t('reviews.rate_experience')}
                </Typography>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {appointment.status === 'confirmed' && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={onCancel}
                  style={styles.cancelButton}
                >
                  <Typography variant="label" style={styles.cancelText}>
                    {t('common.cancel')}
                  </Typography>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 32,
    padding: 24,
    marginBottom: SIZES.lg,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: 'rgba(196, 199, 199, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  mainInfo: {
    flex: 1,
    gap: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  dateInfo: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  timeText: {
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
  },
  barberSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceContainer,
  },
  barberLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: COLORS.onSurfaceVariant,
  },
  barberName: {
    fontSize: 14,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(186, 26, 26, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.1)',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: '#BA1A1A',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  rebookButton: {
    backgroundColor: COLORS.secondaryContainer,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rebookText: {
    color: COLORS.onSecondaryContainer,
    fontWeight: '800',
  },
  reviewButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewText: {
    color: COLORS.white,
    textAlign: 'center',
    fontWeight: '800',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
