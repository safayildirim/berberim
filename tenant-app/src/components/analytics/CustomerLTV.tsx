import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SHADOWS, TYPOGRAPHY, SIZES } from '@/src/constants/theme';
import { CustomerLTV, LTVSegment } from '@/src/types';
import { LTVSegment as LTVSegmentType } from '@/src/hooks/analytics/useAdvancedAnalytics';
import { useTheme } from '@/src/hooks/useTheme';

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
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.primary }]}>
          {t('analytics.ltv.title').toUpperCase()}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.segmentRow}
      >
        {SEGMENTS.map(({ key, labelKey }) => {
          const isActive = segmentBy === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => onSegmentChange(key)}
              style={[
                styles.segmentChip,
                { backgroundColor: isActive ? colors.primary : colors.surfaceContainerHigh },
              ]}
            >
              <Text
                style={[
                  styles.segmentChipText,
                  { color: isActive ? colors.onPrimary : colors.secondary },
                ]}
              >
                {t(labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading || !data ? (
        <View style={[styles.loadingContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.emptyText, { color: colors.outline }]}>{t('common.loading')}</Text>
        </View>
      ) : (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border + '15' }]}>
          <View style={[styles.summaryRow, { backgroundColor: colors.surfaceContainerLow }]}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.secondary }]}>
                {t('analytics.ltv.avgLtv').toUpperCase()}
              </Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>{data.summary.avg_ltv}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.secondary }]}>
                {t('analytics.ltv.medianLtv').toUpperCase()}
              </Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>{data.summary.median_ltv}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.secondary }]}>
                {t('analytics.ltv.avgVisits').toUpperCase()}
              </Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                {data.summary.avg_visits.toFixed(1)}
              </Text>
            </View>
          </View>

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
                  <Text style={[styles.segmentName, { color: colors.primary }]}>{seg.segment}</Text>
                  <Text style={[styles.segmentValue, { color: colors.primary }]}>{seg.avg_ltv}</Text>
                </View>
                <View style={styles.segmentSubInfo}>
                  <Text style={[styles.segmentCount, { color: colors.secondary }]}>
                    {seg.customer_count} {t('analytics.ltv.customers')}
                  </Text>
                  {index < 3 && (
                    <Text style={[styles.topTierBadge, { color: colors.success }]}>Top Tier</Text>
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
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  segmentRow: {
    gap: 8,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  segmentChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
  },
  segmentChipText: {
    ...TYPOGRAPHY.label,
    fontSize: 12,
    fontWeight: '800',
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    padding: 24,
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    gap: 4,
  },
  summaryLabel: {
    ...TYPOGRAPHY.label,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  summaryValue: {
    ...TYPOGRAPHY.h3,
    fontSize: 20,
    fontWeight: '900',
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
  segmentsList: {
    padding: 12,
  },
  segmentItem: {
    padding: 12,
  },
  lastSegmentItem: {
    borderBottomWidth: 0,
  },
  segmentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  segmentName: {
    ...TYPOGRAPHY.label,
    fontSize: 14,
    fontWeight: '800',
  },
  segmentValue: {
    ...TYPOGRAPHY.label,
    fontSize: 14,
    fontWeight: '900',
  },
  segmentSubInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  segmentCount: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    fontWeight: '600',
  },
  topTierBadge: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
    fontWeight: '900',
  },
});

