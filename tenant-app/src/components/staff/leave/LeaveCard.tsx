import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
} from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { SHADOWS, TYPOGRAPHY } from '@/src/constants/theme';
import { useTranslation } from 'react-i18next';
import { TimeOff } from '@/src/types';
import { useTheme } from '@/src/hooks/useTheme';

interface LeaveCardProps {
  entry: TimeOff;
  onPress?: () => void;
}

export const LeaveCard = ({ entry, onPress }: LeaveCardProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'holiday':
        return colors.info || '#3b82f6';
      case 'leave':
        return colors.warning || '#f59e0b';
      case 'closure':
        return colors.error;
      default:
        return colors.primary;
    }
  };

  const startDate = parseISO(entry.start_at);
  const endDate = parseISO(entry.end_at);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const color = getTypeColor(entry.type);
  const typeLabels: Record<string, string> = {
    leave: t('settings.staff.schedule.personal'),
    holiday: t('settings.staff.schedule.holiday'),
    closure: t('settings.staff.schedule.closure'),
  };
  const typeLabel = typeLabels[entry.type] || entry.type;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surfaceContainerLowest }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.indicator, { backgroundColor: color }]} />

      <View style={styles.topSection}>
        <View
          style={[
            styles.dateBox,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          <Text style={[styles.dayText, { color: colors.primary }]}>
            {format(startDate, 'dd')}
          </Text>
          <Text style={[styles.monthText, { color: colors.secondary }]}>
            {format(startDate, 'MMM').toUpperCase()}
          </Text>
        </View>

        <View style={styles.details}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.title, { color: colors.primary }]}
              numberOfLines={2}
            >
              {entry.reason || typeLabel}
            </Text>
            <View style={[styles.badge, { backgroundColor: color + '15' }]}>
              <Text style={[styles.badgeText, { color }]}>{typeLabel}</Text>
            </View>
          </View>

          <View style={styles.dateRow}>
            <CalendarIcon size={14} color={colors.secondary} />
            <Text style={[styles.dateText, { color: colors.onSurfaceVariant }]}>
              {format(startDate, 'MMM dd')} - {format(endDate, 'MMM dd, yyyy')}
            </Text>
          </View>
        </View>
      </View>

      <View
        style={[styles.divider, { backgroundColor: colors.border + '15' }]}
      />

      <View style={styles.bottomSection}>
        <View style={styles.infoBlock}>
          <Clock size={14} color={colors.secondary} />
          <View>
            <Text style={[styles.durationLabel, { color: colors.secondary }]}>
              {t('settings.staff.schedule.duration').toUpperCase()}
            </Text>
            <Text style={[styles.durationValue, { color: colors.primary }]}>
              {diffDays}{' '}
              {diffDays === 1
                ? t('settings.staff.schedule.day')
                : t('settings.staff.schedule.days')}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.actionBtn}>
          <ChevronRight size={20} color={colors.secondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  indicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dateBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    ...TYPOGRAPHY.h2,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
  },
  monthText: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  details: {
    flex: 1,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    ...TYPOGRAPHY.h3,
    fontSize: 18,
    fontWeight: '800',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  bottomSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  durationLabel: {
    ...TYPOGRAPHY.label,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  durationValue: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    fontWeight: '800',
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
