import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  CalendarClock,
  CheckCircle2,
  Info,
  RotateCcw,
  Star,
  XCircle,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';
import { Appointment } from '@/src/types';

interface BookingCardProps {
  booking: Appointment;
  type: 'upcoming' | 'past';
  onCancel?: () => void;
  onDetails?: () => void;
  onReview?: () => void;
  onRebook?: () => void;
}

export const BookingCard = ({
  booking,
  type,
  onCancel,
  onDetails,
  onReview,
  onRebook,
}: BookingCardProps) => {
  const { colors, isDark } = useTheme();
  const { t, i18n } = useTranslation();

  const startTime = parseISO(booking.starts_at);
  const dateLocale = i18n.language.startsWith('tr') ? tr : enUS;
  const formattedDate = format(startTime, 'PPP p', { locale: dateLocale });

  const serviceName = booking.services
    ? booking.services.map((s) => s.service_name).join(' + ')
    : '---';

  if (type === 'upcoming') {
    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.outlineVariant,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.shopInfo}>
            <Image
              source={{
                uri:
                  booking.shop?.logo_url ||
                  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
              }}
              style={styles.shopImage}
            />
            <View>
              <Typography style={[styles.shopName, { color: colors.text }]}>
                {booking.shop?.name || t('common.barberShop')}
              </Typography>
              <Typography
                variant="caption"
                style={{ color: colors.onSurfaceVariant }}
              >
                • {booking.staff?.first_name} {booking.staff?.last_name}
              </Typography>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.infoRow,
            {
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.03)'
                : 'rgba(0,0,0,0.02)',
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <View style={styles.infoItem}>
            <CalendarClock size={16} color="#f59e0b" />
            <Typography style={[styles.infoText, { color: colors.text }]}>
              {formattedDate}
            </Typography>
          </View>
          <View
            style={[styles.divider, { backgroundColor: colors.outlineVariant }]}
          />
          <Typography style={[styles.serviceText, { color: colors.text }]}>
            {serviceName}
          </Typography>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={onCancel}
            style={[
              styles.cancelButton,
              {
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2',
                borderColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fecaca',
              },
            ]}
          >
            <XCircle size={16} color="#ef4444" />
            <Typography style={styles.cancelText}>
              {t('common.cancel')}
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDetails}
            style={[styles.detailsButton, { backgroundColor: '#f59e0b' }]}
          >
            <Info size={16} color="#000" />
            <Typography style={styles.detailsText}>
              {t('common.details')}
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.outlineVariant,
        },
      ]}
    >
      <View style={styles.pastHeader}>
        <Typography
          variant="caption"
          style={{ color: colors.onSurfaceVariant }}
        >
          {formattedDate}
        </Typography>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                booking.status === 'completed'
                  ? isDark
                    ? 'rgba(34, 197, 94, 0.1)'
                    : '#dcfce7'
                  : isDark
                    ? 'rgba(239, 68, 68, 0.1)'
                    : '#fee2e2',
            },
          ]}
        >
          {booking.status === 'completed' ? (
            <CheckCircle2 size={12} color="#22c55e" />
          ) : (
            <XCircle size={12} color="#ef4444" />
          )}
          <Typography
            variant="caption"
            style={[
              styles.statusText,
              {
                color: booking.status === 'completed' ? '#22c55e' : '#ef4444',
              },
            ]}
          >
            {t(`appointments.status.${booking.status}`)}
          </Typography>
        </View>
      </View>

      <View style={styles.shopInfo}>
        <Image
          source={{
            uri:
              booking.shop?.logo_url ||
              'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
          }}
          style={styles.shopImage}
        />
        <View>
          <Typography style={[styles.shopName, { color: colors.text }]}>
            {booking.shop?.name || t('common.barberShop')}
          </Typography>
          <Typography
            variant="caption"
            style={{ color: colors.onSurfaceVariant }}
          >
            {serviceName} • {booking.staff?.first_name}{' '}
            {booking.staff?.last_name}
          </Typography>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={onReview}
          style={[
            styles.reviewButton,
            {
              backgroundColor: colors.surfaceContainer,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <Star size={16} color="#f59e0b" />
          <Typography style={[styles.reviewText, { color: colors.text }]}>
            {t('appointments.review')}
          </Typography>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onRebook}
          style={[styles.rebookButton, { backgroundColor: '#f59e0b' }]}
        >
          <RotateCcw size={16} color="#000" />
          <Typography style={styles.rebookButtonText}>
            {t('appointments.rebookShort')}
          </Typography>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  header: {
    marginBottom: 16,
  },
  pastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  shopImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  shopName: {
    fontSize: 15,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 16,
    marginHorizontal: 12,
  },
  serviceText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  cancelText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
  detailsButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  detailsText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  reviewButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  reviewText: {
    fontSize: 14,
    fontWeight: '700',
  },
  rebookButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  rebookButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
});
