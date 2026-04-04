import { Calendar, CheckCircle2, UserMinus } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SHADOWS } from '@/src/constants/theme';

interface Props {
  completed: number;
  upcoming: number;
  noShows: number;
}

const StatCard = ({ title, count, icon: Icon, color, isWide = false }: any) => (
  <View
    style={[
      styles.statCard,
      isWide && styles.statCardWide,
      { borderColor: color + '20' },
    ]}
  >
    <View style={[styles.statIconContainer, { backgroundColor: color + '10' }]}>
      <Icon size={20} color={color} strokeWidth={2.5} />
    </View>
    <View>
      <Text style={styles.statTitle}>{title.toUpperCase()}</Text>
      <Text style={styles.statCount}>{count}</Text>
    </View>
  </View>
);

export const DashboardStatsGrid: React.FC<Props> = ({
  completed,
  upcoming,
  noShows,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.statsGrid}>
      <StatCard
        title={t('dashboard.stats.completed')}
        count={completed.toString()}
        icon={CheckCircle2}
        color={COLORS.success}
      />
      <StatCard
        title={t('dashboard.stats.upcoming')}
        count={upcoming.toString()}
        icon={Calendar}
        color={COLORS.info}
      />
      <StatCard
        title={t('dashboard.stats.noShows')}
        count={noShows.toString()}
        icon={UserMinus}
        color={COLORS.error}
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
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 16,
    margin: '1%',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
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
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  statCount: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
  },
});
