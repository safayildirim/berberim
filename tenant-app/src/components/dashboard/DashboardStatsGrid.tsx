import { Calendar, CheckCircle2, UserMinus } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { SHADOWS, TYPOGRAPHY } from '@/src/constants/theme';
import { useTheme } from '@/src/hooks/useTheme';

interface Props {
  completed: number;
  upcoming: number;
  noShows: number;
}

const StatCard = ({
  title,
  count,
  icon: Icon,
  color,
  colors,
  isWide = false,
}: any) => (
  <View
    style={[
      styles.statCard,
      { backgroundColor: colors.card, borderColor: colors.border + '15' },
      isWide && styles.statCardWide,
    ]}
  >
    <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
      <Icon size={20} color={color} strokeWidth={2.5} />
    </View>
    <View>
      <Text style={[styles.statTitle, { color: colors.secondary }]}>
        {title.toUpperCase()}
      </Text>
      <Text style={[styles.statCount, { color: colors.primary }]}>{count}</Text>
    </View>
  </View>
);

export const DashboardStatsGrid: React.FC<Props> = ({
  completed,
  upcoming,
  noShows,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.statsGrid}>
      <StatCard
        title={t('dashboard.stats.completed')}
        count={completed.toString()}
        icon={CheckCircle2}
        color={colors.success}
        colors={colors}
      />
      <StatCard
        title={t('dashboard.stats.upcoming')}
        count={upcoming.toString()}
        icon={Calendar}
        color={colors.info}
        colors={colors}
      />
      <StatCard
        title={t('dashboard.stats.noShows')}
        count={noShows.toString()}
        icon={UserMinus}
        color={colors.error}
        colors={colors}
        isWide
      />
    </View>
  );
};

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    borderRadius: 24,
    padding: 16,
    margin: '1%',
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  statCardWide: {
    width: '98%',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statTitle: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statCount: {
    ...TYPOGRAPHY.h2,
    fontSize: 28,
  },
});
