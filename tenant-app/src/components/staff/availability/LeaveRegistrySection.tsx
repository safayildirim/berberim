import React from 'react';
import { Calendar, Plane, Store, UserRound } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TYPOGRAPHY } from '@/src/constants/theme';
import { useTheme } from '@/src/hooks/useTheme';
import { TimeOff } from '@/src/types';

type Props = {
  entries: TimeOff[];
};

export const LeaveRegistrySection = ({ entries }: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.primary }]}>
          {t('settings.staff.availability.upcomingLeave', {
            count: entries.length,
          })}
        </Text>
        <View style={styles.requestButton}>
          <Text style={[styles.requestText, { color: colors.primary }]}>
            {t('settings.staff.availability.requestLeave')}
          </Text>
        </View>
      </View>
      <View style={styles.list}>
        {entries.map((entry) => (
          <LeaveRegistryCard key={entry.id} entry={entry} />
        ))}
        {entries.length === 0 && (
          <View
            style={[
              styles.emptyState,
              {
                backgroundColor: colors.surfaceContainerLowest,
                borderColor: colors.outlineVariant + '4D',
              },
            ]}
          >
            <Calendar size={32} color={colors.secondary} />
            <Text style={[styles.emptyText, { color: colors.secondary }]}>
              {t('settings.staff.availability.noUpcomingLeave')}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const LeaveRegistryCard = ({ entry }: { entry: TimeOff }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const startDate = parseISO(entry.start_at);
  const endDate = parseISO(entry.end_at);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const meta = getLeaveMeta(entry.type, colors, t);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceContainerLowest,
          borderColor: colors.outlineVariant + '26',
        },
      ]}
    >
      <View style={[styles.indicator, { backgroundColor: meta.color }]} />
      <View style={styles.cardMain}>
        <View
          style={[styles.iconBox, { backgroundColor: meta.iconBackground }]}
        >
          <meta.Icon size={22} color={meta.color} />
        </View>
        <View style={styles.cardCopy}>
          <Text style={[styles.entryTitle, { color: colors.primary }]}>
            {entry.reason || meta.label}
          </Text>
          <Text style={[styles.entryDate, { color: colors.secondary }]}>
            {formatDateRange(startDate, endDate)}
          </Text>
        </View>
      </View>
      <View style={styles.entryMeta}>
        <View
          style={[
            styles.typeBadge,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          <Text style={[styles.typeText, { color: colors.secondary }]}>
            {meta.label}
          </Text>
        </View>
        <Text style={[styles.duration, { color: colors.primary }]}>
          {t('settings.staff.availability.duration', { count: diffDays })}
        </Text>
      </View>
    </View>
  );
};

const formatDateRange = (startDate: Date, endDate: Date) => {
  if (startDate.toDateString() === endDate.toDateString()) {
    return format(startDate, 'MMM dd, yyyy');
  }
  return `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`;
};

const getLeaveMeta = (
  type: TimeOff['type'],
  colors: ReturnType<typeof useTheme>['colors'],
  t: (key: string) => string,
) => {
  switch (type) {
    case 'holiday':
      return {
        label: t('settings.staff.availability.holiday'),
        color: colors.onTertiaryContainer,
        iconBackground: colors.tertiaryFixedDim + '4D',
        Icon: Plane,
      };
    case 'closure':
      return {
        label: t('settings.staff.availability.closure'),
        color: colors.secondary,
        iconBackground: colors.surfaceContainerHigh,
        Icon: Store,
      };
    case 'leave':
    default:
      return {
        label: t('settings.staff.availability.personal'),
        color: colors.primary,
        iconBackground: colors.primaryFixed + '4D',
        Icon: UserRound,
      };
  }
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    ...TYPOGRAPHY.h2,
    fontSize: 24,
    fontWeight: '900',
    flex: 1,
  },
  requestButton: {
    paddingVertical: 8,
  },
  requestText: {
    ...TYPOGRAPHY.label,
    fontWeight: '800',
  },
  list: {
    gap: 16,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 18,
  },
  indicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCopy: {
    flex: 1,
    gap: 4,
  },
  entryTitle: {
    ...TYPOGRAPHY.bodyBold,
    fontWeight: '800',
  },
  entryDate: {
    ...TYPOGRAPHY.label,
    fontSize: 13,
  },
  entryMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  typeBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  typeText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  duration: {
    ...TYPOGRAPHY.label,
    fontWeight: '800',
  },
  emptyState: {
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: 48,
    alignItems: 'center',
    gap: 14,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    textAlign: 'center',
  },
});
