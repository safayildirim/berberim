import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/src/constants/theme';

interface Props {
  revenue?: string;
  utilization?: string;
  rating?: string;
}

export const DashboardShopInsights: React.FC<Props> = ({
  revenue = '0',
  utilization = '0%',
  rating = '0',
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.insightsContainer}>
      <Text style={styles.insightsLabel}>{t('dashboard.insights.title')}</Text>
      <View style={styles.insightsRow}>
        <View style={styles.insightItem}>
          <Text style={styles.insightValue}>{revenue}</Text>
          <Text style={styles.insightSub}>
            {t('dashboard.insights.revToday')}
          </Text>
        </View>
        <View style={styles.insightDivider} />
        <View style={styles.insightItem}>
          <Text style={styles.insightValue}>{utilization}</Text>
          <Text style={styles.insightSub}>
            {t('dashboard.insights.utilization')}
          </Text>
        </View>
        <View style={styles.insightDivider} />
        <View style={styles.insightItem}>
          <Text style={styles.insightValue}>{rating}</Text>
          <Text style={styles.insightSub}>
            {t('dashboard.insights.avgRating')}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  insightsContainer: {
    backgroundColor: '#f2f4f6',
    padding: 32,
    alignItems: 'center',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: 16,
  },
  insightsLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.secondary,
    letterSpacing: 2,
    marginBottom: 24,
  },
  insightsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  insightItem: {
    flex: 1,
    alignItems: 'center',
  },
  insightValue: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 4,
  },
  insightSub: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  insightDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
});
