import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight, Calendar as CalendarIcon } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { COLORS } from '@/src/constants/theme';
import { useTranslation } from 'react-i18next';
import { TimeOff } from '@/src/types';

interface LeaveCardProps {
  entry: TimeOff;
  onPress?: () => void;
}

export const LeaveCard = ({ entry, onPress }: LeaveCardProps) => {
  const { t } = useTranslation();

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'holiday':
        return '#3b82f6';
      case 'leave':
        return '#f59e0b';
      case 'closure':
        return COLORS.error;
      default:
        return COLORS.primary;
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
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.indicator, { backgroundColor: color }]} />

      {/* Top section: date box + info */}
      <View style={styles.topSection}>
        <View style={styles.dateBox}>
          <Text style={styles.dayText}>{format(startDate, 'dd')}</Text>
          <Text style={styles.monthText}>
            {format(startDate, 'MMM').toUpperCase()}
          </Text>
        </View>

        <View style={styles.details}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {entry.reason || typeLabel}
            </Text>
            <View style={[styles.badge, { backgroundColor: color + '15' }]}>
              <Text style={[styles.badgeText, { color }]}>{typeLabel}</Text>
            </View>
          </View>

          <View style={styles.dateRow}>
            <CalendarIcon size={14} color={COLORS.secondary} />
            <Text style={styles.dateText}>
              {format(startDate, 'MMM dd, yyyy')}
            </Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Bottom section: duration + chevron */}
      <View style={styles.bottomSection}>
        <View>
          <Text style={styles.durationLabel}>
            {t('settings.staff.schedule.duration').toUpperCase()}
          </Text>
          <Text style={styles.durationValue}>
            {diffDays}{' '}
            {diffDays === 1
              ? t('settings.staff.schedule.day')
              : t('settings.staff.schedule.days')}
          </Text>
        </View>
        <ChevronRight size={22} color={COLORS.secondary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dateBox: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: 'Manrope',
    lineHeight: 26,
  },
  monthText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.secondary,
    letterSpacing: 0.5,
  },
  details: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    flexShrink: 1,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: 'Manrope',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.outlineVariant + '20',
    marginVertical: 16,
  },
  bottomSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  durationLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  durationValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: 'Manrope',
  },
});
