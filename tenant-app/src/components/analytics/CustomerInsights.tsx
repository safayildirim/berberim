import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, Text } from 'react-native';
import { SHADOWS, TYPOGRAPHY, SIZES } from '@/src/constants/theme';
import { useTheme } from '@/src/hooks/useTheme';

interface CustomerInsightsProps {
  insights: {
    activeCustomers: number;
    returningRate: number;
    visitFrequency: number;
  };
}

export const CustomerInsights = ({ insights }: CustomerInsightsProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>
        {t('analytics.customerInsights.title').toUpperCase()}
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border + '15' },
        ]}
      >
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.label, { color: colors.secondary }]}>
              {t('analytics.customerInsights.activeCustomers')}
            </Text>
            <Text style={[styles.value, { color: colors.primary }]}>
              {insights.activeCustomers}
            </Text>
          </View>
          <View style={styles.rightAlign}>
            <Text style={[styles.label, { color: colors.secondary }]}>
              {t('analytics.customerInsights.returningRate')}
            </Text>
            <Text style={[styles.value, { color: colors.primary }]}>
              {insights.returningRate}%
            </Text>
          </View>
        </View>

        <View
          style={[styles.divider, { backgroundColor: colors.border + '10' }]}
        />

        <View style={styles.bottomSection}>
          <Text style={[styles.label, { color: colors.secondary }]}>
            {t('analytics.customerInsights.visitFrequency')}
          </Text>
          <View style={styles.progressRow}>
            <View
              style={[
                styles.progressTrack,
                { backgroundColor: colors.surfaceContainerLow },
              ]}
            >
              <View
                style={[
                  styles.progressBar,
                  {
                    backgroundColor: colors.primary,
                    width: `${Math.min((insights.visitFrequency / 30) * 100, 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressValue, { color: colors.primary }]}>
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
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: SIZES.sm,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 24,
    padding: SIZES.md,
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  label: {
    ...TYPOGRAPHY.label,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 9,
  },
  value: {
    ...TYPOGRAPHY.h3,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  rightAlign: {
    alignItems: 'flex-end',
  },
  divider: {
    height: 1,
    marginBottom: SIZES.md,
  },
  bottomSection: {
    gap: SIZES.sm,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  progressTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  progressValue: {
    ...TYPOGRAPHY.label,
    fontWeight: '900',
    fontSize: 12,
  },
});
