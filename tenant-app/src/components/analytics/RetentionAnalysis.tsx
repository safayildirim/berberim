import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { COLORS, TYPOGRAPHY, SIZES } from '@/src/constants/theme';
import { RetentionAnalysis, RetentionBucket } from '@/src/types';
import { RetentionRange } from '@/src/hooks/analytics/useAdvancedAnalytics';

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('analytics.retention.title')}</Text>
        <View style={styles.rangeRow}>
          {RANGES.map((r) => (
            <TouchableOpacity
              key={r.key}
              onPress={() => onRangeChange(r.key)}
              style={[
                styles.rangeChip,
                range === r.key && styles.rangeChipActive,
              ]}
            >
              <Text
                style={[
                  styles.rangeChipText,
                  range === r.key && styles.rangeChipTextActive,
                ]}
              >
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading || !data ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>{t('common.loading')}</Text>
        </View>
      ) : (
        <View style={styles.card}>
          {/* Summary Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>
                {t('analytics.retention.totalCustomers')}
              </Text>
              <Text style={styles.statValue}>
                {(data.total_customers / 1000).toFixed(1)}k
              </Text>
            </View>
            <View style={[styles.statItem, styles.statItemBorder]}>
              <Text style={styles.statLabel}>
                {t('analytics.retention.returnRate')}
              </Text>
              <Text style={styles.statValue}>
                {Math.round(data.overall_return_rate)}%
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>
                {t('analytics.retention.avgDays')}
              </Text>
              <Text style={styles.statValue}>
                {Math.round(data.avg_days_between_visits)}
              </Text>
            </View>
          </View>

          {/* Return Buckets */}
          <View style={styles.bucketsSection}>
            {data.buckets.map((bucket: RetentionBucket) => (
              <View key={bucket.label} style={styles.bucketRow}>
                <Text style={styles.bucketLabel}>{bucket.label}</Text>
                <View style={styles.bucketBarTrack}>
                  <View
                    style={[
                      styles.bucketBar,
                      {
                        width: `${Math.min(bucket.percentage, 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.bucketValue}>{bucket.percentage}%</Text>
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
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  rangeRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 8,
    padding: 2,
  },
  rangeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rangeChipActive: {
    backgroundColor: COLORS.primary,
  },
  rangeChipText: {
    ...TYPOGRAPHY.caption,
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  rangeChipTextActive: {
    color: COLORS.white,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + '15',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 16,
    elevation: 1,
  },
  loadingContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.muted,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statItemBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.surfaceContainer,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    ...TYPOGRAPHY.h2,
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
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
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.secondary,
    width: 65,
  },
  bucketBarTrack: {
    flex: 1,
    height: 12,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bucketBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  bucketValue: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    width: 32,
    textAlign: 'right',
  },
});
