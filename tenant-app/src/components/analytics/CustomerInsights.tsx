import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS, TYPOGRAPHY, SIZES } from '@/src/constants/theme';

interface CustomerInsightsProps {
  insights: {
    activeCustomers: number;
    returningRate: number;
    visitFrequency: number;
  };
}

export const CustomerInsights = ({ insights }: CustomerInsightsProps) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        {t('analytics.customerInsights.title')}
      </Text>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.label}>
              {t('analytics.customerInsights.activeCustomers')}
            </Text>
            <Text style={styles.value}>{insights.activeCustomers}</Text>
          </View>
          <View style={styles.rightAlign}>
            <Text style={styles.label}>
              {t('analytics.customerInsights.returningRate')}
            </Text>
            <Text style={styles.value}>{insights.returningRate}%</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.bottomSection}>
          <Text style={styles.label}>
            {t('analytics.customerInsights.visitFrequency')}
          </Text>
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${(insights.visitFrequency / 30) * 100}%` }, // scaling assumes 30 day max
                ]}
              />
            </View>
            <Text style={styles.progressValue}>
              {insights.visitFrequency.toFixed(1)} {t('common.days')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: SIZES.lg,
    paddingHorizontal: SIZES.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.label,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SIZES.sm,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + '20',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  label: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 10,
  },
  value: {
    ...TYPOGRAPHY.h3,
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 2,
  },
  rightAlign: {
    alignItems: 'flex-end',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceContainer,
    marginBottom: SIZES.md,
  },
  bottomSection: {
    gap: SIZES.xs,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primaryContainer,
    borderRadius: 4,
  },
  progressValue: {
    ...TYPOGRAPHY.label,
    fontWeight: '800',
    color: COLORS.primary,
    fontSize: 12,
  },
});
