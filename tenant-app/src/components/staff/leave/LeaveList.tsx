import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/src/constants/theme';
import { useTranslation } from 'react-i18next';
import { TimeOff } from '@/src/types';
import { LeaveCard } from '@/src/components/staff/leave/LeaveCard';

interface LeaveListProps {
  entries: TimeOff[];
  onSelect?: (id: string) => void;
}

export const LeaveList = ({ entries, onSelect }: LeaveListProps) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {t('settings.staff.schedule.upcomingLeave')}
        </Text>
        <Text style={styles.subtitle}>
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
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No upcoming leave scheduled.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: 'Manrope',
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.outlineVariant + '40',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '600',
  },
});
