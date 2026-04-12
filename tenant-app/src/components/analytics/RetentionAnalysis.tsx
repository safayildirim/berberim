import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SHADOWS, TYPOGRAPHY, SIZES } from '@/src/constants/theme';
import { RetentionAnalysis, RetentionBucket } from '@/src/types';
import { RetentionRange } from '@/src/hooks/analytics/useAdvancedAnalytics';
import { useTheme } from '@/src/hooks/useTheme';

interface RetentionAnalysisProps {
  data: RetentionAnalysis | undefined;
  isLoading: boolean;
  range: RetentionRange;
  onRangeChange: (range: RetentionRange) => void;
}

const RANGES: { key: RetentionRange; label: string }[] = [
  { key: '30d', label: '30d' },
  { key: '90d', label: '90d' },
  { key: '180d', label: '180d' },
];

export const RetentionAnalysisSection = ({
  data,
  isLoading,
  range,
  onRangeChange,
}: RetentionAnalysisProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.primary }]}>
          {t('analytics.retention.title').toUpperCase()}
        </Text>
        <View
          style={[
            styles.rangeRow,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          {RANGES.map((r) => {
            const isActive = range === r.key;
            return (
              <TouchableOpacity
                key={r.key}
                onPress={() => onRangeChange(r.key)}
                style={[
                  styles.rangeChip,
                  {
                    backgroundColor: isActive ? colors.primary : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.rangeChipText,
                    { color: isActive ? colors.onPrimary : colors.secondary },
                  ]}
                >
                  {r.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {isLoading || !data ? (
        <View
          style={[styles.loadingContainer, { backgroundColor: colors.card }]}
        >
          <Text style={[styles.emptyText, { color: colors.outline }]}>
            {t('common.loading')}
          </Text>
        </View>
      ) : (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border + '15' },
          ]}
        >
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.secondary }]}>
                {t('analytics.retention.totalCustomers')}
              </Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {(data.total_customers / 1000).toFixed(1)}k
              </Text>
            </View>
            <View
              style={[
                styles.statItem,
                styles.statItemBorder,
                { borderColor: colors.border + '15' },
              ]}
            >
              <Text style={[styles.statLabel, { color: colors.secondary }]}>
                {t('analytics.retention.returnRate')}
              </Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {Math.round(data.overall_return_rate)}%
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.secondary }]}>
                {t('analytics.retention.avgDays')}
              </Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {Math.round(data.avg_days_between_visits)}
              </Text>
            </View>
          </View>

          <View style={styles.bucketsSection}>
            {data.buckets.map((bucket: RetentionBucket) => (
              <View key={bucket.label} style={styles.bucketRow}>
                <Text style={[styles.bucketLabel, { color: colors.secondary }]}>
                  {bucket.label}
                </Text>
                <View
                  style={[
                    styles.bucketBarTrack,
                    { backgroundColor: colors.surfaceContainerLow },
                  ]}
                >
                  <View
                    style={[
                      styles.bucketBar,
                      {
                        backgroundColor: colors.primary,
                        width: `${Math.min(bucket.percentage, 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.bucketValue, { color: colors.primary }]}>
                  {bucket.percentage}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SIZES.md,
    marginTop: SIZES.lg,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  title: {
    ...TYPOGRAPHY.label,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  rangeRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 2,
  },
  rangeChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  rangeChipText: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
    fontWeight: '800',
  },
  card: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  loadingContainer: {
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statItemBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  statLabel: {
    ...TYPOGRAPHY.label,
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    ...TYPOGRAPHY.h3,
    fontSize: 22,
    fontWeight: '900',
  },
  bucketsSection: {
    gap: 16,
  },
  bucketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bucketLabel: {
    ...TYPOGRAPHY.label,
    fontSize: 11,
    fontWeight: '700',
    width: 75,
  },
  bucketBarTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  bucketBar: {
    height: '100%',
    borderRadius: 5,
  },
  bucketValue: {
    ...TYPOGRAPHY.label,
    fontSize: 12,
    fontWeight: '900',
    width: 35,
    textAlign: 'right',
  },
});
