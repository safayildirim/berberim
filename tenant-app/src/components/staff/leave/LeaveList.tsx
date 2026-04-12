import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TYPOGRAPHY, SIZES } from '@/src/constants/theme';
import { useTranslation } from 'react-i18next';
import { TimeOff } from '@/src/types';
import { LeaveCard } from '@/src/components/staff/leave/LeaveCard';
import { Calendar } from 'lucide-react-native';
import { useTheme } from '@/src/hooks/useTheme';

interface LeaveListProps {
  entries: TimeOff[];
  onSelect?: (id: string) => void;
}

export const LeaveList = ({ entries, onSelect }: LeaveListProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.primary }]}>
            {t('settings.staff.schedule.upcomingLeave')}
          </Text>
          <View
            style={[styles.badge, { backgroundColor: colors.primary + '10' }]}
          >
            <Text style={[styles.badgeText, { color: colors.primary }]}>
              {entries.length}
            </Text>
          </View>
        </View>
        <Text style={[styles.subtitle, { color: colors.secondary }]}>
          {t('settings.staff.schedule.sortByDate')}
        </Text>
      </View>

      {entries.map((entry) => (
        <LeaveCard
          key={entry.id}
          entry={entry}
          onPress={() => onSelect?.(entry.id)}
        />
      ))}

      {entries.length === 0 && (
        <View
          style={[
            styles.emptyState,
            {
              backgroundColor: colors.surfaceContainerLowest,
              borderColor: colors.border + '30',
            },
          ]}
        >
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: colors.surfaceContainerLow },
            ]}
          >
            <Calendar size={32} color={colors.secondary} />
          </View>
          <Text style={[styles.emptyText, { color: colors.secondary }]}>
            {t('settings.staff.schedule.noUpcomingLeave')}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
    paddingHorizontal: 4,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    ...TYPOGRAPHY.h3,
    fontSize: 20,
    fontWeight: '800',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    ...TYPOGRAPHY.label,
    fontSize: 12,
    fontWeight: '900',
  },
  subtitle: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
    borderRadius: 32,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: 16,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.7,
  },
});
