import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { TYPOGRAPHY } from '@/src/constants/theme';

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
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.insightsContainer,
        { backgroundColor: colors.surfaceContainerLow },
      ]}
    >
      <Text style={[styles.insightsLabel, { color: colors.secondary }]}>
        {t('dashboard.insights.title').toUpperCase()}
      </Text>
      <View style={styles.insightsRow}>
        <View style={styles.insightItem}>
          <Text style={[styles.insightValue, { color: colors.primary }]}>
            {revenue}
          </Text>
          <Text style={[styles.insightSub, { color: colors.secondary }]}>
            {t('dashboard.insights.revToday')}
          </Text>
        </View>
        <View
          style={[
            styles.insightDivider,
            { backgroundColor: colors.border + '20' },
          ]}
        />
        <View style={styles.insightItem}>
          <Text style={[styles.insightValue, { color: colors.primary }]}>
            {utilization}
          </Text>
          <Text style={[styles.insightSub, { color: colors.secondary }]}>
            {t('dashboard.insights.utilization')}
          </Text>
        </View>
        <View
          style={[
            styles.insightDivider,
            { backgroundColor: colors.border + '20' },
          ]}
        />
        <View style={styles.insightItem}>
          <Text style={[styles.insightValue, { color: colors.primary }]}>
            {rating}
          </Text>
          <Text style={[styles.insightSub, { color: colors.secondary }]}>
            {t('dashboard.insights.avgRating')}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  insightsContainer: {
    padding: 32,
    alignItems: 'center',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: 16,
  },
  insightsLabel: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
    fontWeight: '900',
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
    ...TYPOGRAPHY.h2,
    fontSize: 24,
    marginBottom: 4,
  },
  insightSub: {
    ...TYPOGRAPHY.caption,
    fontSize: 9,
    fontWeight: '800',
  },
  insightDivider: {
    width: 1,
    height: 32,
  },
});
