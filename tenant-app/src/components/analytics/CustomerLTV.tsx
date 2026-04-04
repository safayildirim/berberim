import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SIZES } from '@/src/constants/theme';
import { CustomerLTV, LTVSegment } from '@/src/types';
import { LTVSegment as LTVSegmentType } from '@/src/hooks/analytics/useAdvancedAnalytics';

interface CustomerLTVProps {
  data: CustomerLTV | undefined;
  isLoading: boolean;
  segmentBy: LTVSegmentType;
  onSegmentChange: (segment: LTVSegmentType) => void;
}

const SEGMENTS: { key: LTVSegmentType; labelKey: string }[] = [
  { key: 'cohort', labelKey: 'analytics.ltv.byCohort' },
  { key: 'acquisition_channel', labelKey: 'analytics.ltv.byChannel' },
  { key: 'service_category', labelKey: 'analytics.ltv.byCategory' },
];

export const CustomerLTVSection = ({
  data,
  isLoading,
  segmentBy,
  onSegmentChange,
}: CustomerLTVProps) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('analytics.ltv.title')}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.segmentRow}
      >
        {SEGMENTS.map(({ key, labelKey }) => (
          <TouchableOpacity
            key={key}
            onPress={() => onSegmentChange(key)}
            style={[
              styles.segmentChip,
              segmentBy === key && styles.segmentChipActive,
            ]}
          >
            <Text
              style={[
                styles.segmentChipText,
                segmentBy === key && styles.segmentChipTextActive,
              ]}
            >
              {t(labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading || !data ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>{t('common.loading')}</Text>
        </View>
      ) : (
        <View style={styles.card}>
          {/* Summary Stats */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>
                {t('analytics.ltv.avgLtv')}
              </Text>
              <Text style={styles.summaryValue}>{data.summary.avg_ltv}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>
                {t('analytics.ltv.medianLtv')}
              </Text>
              <Text style={styles.summaryValue}>{data.summary.median_ltv}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>
                {t('analytics.ltv.avgVisits')}
              </Text>
              <Text style={styles.summaryValue}>
                {data.summary.avg_visits.toFixed(1)}
              </Text>
            </View>
          </View>

          {/* Segment List */}
          <View style={styles.segmentsList}>
            {data.segments.map((seg: LTVSegment, index) => (
              <View
                key={seg.segment || index}
                style={[
                  styles.segmentItem,
                  index === data.segments.length - 1 && styles.lastSegmentItem,
                ]}
              >
                <View style={styles.segmentInfo}>
                  <Text style={styles.segmentName}>{seg.segment}</Text>
                  <Text style={styles.segmentValue}>{seg.avg_ltv}</Text>
                </View>
                <View style={styles.segmentSubInfo}>
                  <Text style={styles.segmentCount}>
                    {seg.customer_count} {t('analytics.ltv.customers')}
                  </Text>
                  {index === 0 && (
                    <Text style={styles.topTierBadge}>Top Tier</Text>
                  )}
                </View>
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
    paddingHorizontal: 4,
  },
  title: {
    ...TYPOGRAPHY.label,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  segmentRow: {
    gap: 4,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  segmentChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  segmentChipActive: {
    backgroundColor: COLORS.primary,
  },
  segmentChipText: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  segmentChipTextActive: {
    color: COLORS.white,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + '15',
    overflow: 'hidden',
  },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLow + '80',
    padding: 20,
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    gap: 2,
  },
  summaryLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    ...TYPOGRAPHY.h2,
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
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
  segmentsList: {
    padding: 8,
  },
  segmentItem: {
    padding: 12,
    // borderRadius: 12, // Optional, can match standard layout
  },
  lastSegmentItem: {
    borderBottomWidth: 0,
  },
  segmentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  segmentName: {
    ...TYPOGRAPHY.label,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  segmentValue: {
    ...TYPOGRAPHY.label,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  segmentSubInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  segmentCount: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.secondary,
  },
  topTierBadge: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: '800',
    color: '#059669', // emerald-600
  },
});
