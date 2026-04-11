import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Screen } from '@/src/components/common/Screen';
import { SIZES } from '@/src/constants/theme';
import { useAnalytics } from '@/src/hooks/analytics/useAnalytics';
import {
  useCohortAnalysis,
  useRetentionAnalysis,
  useCustomerLTV,
  useNoShowAnalysis,
} from '@/src/hooks/analytics/useAdvancedAnalytics';
import { TimeRangeSelector } from '@/src/components/analytics/TimeRangeSelector';
import { ShopStatusBanner } from '@/src/components/analytics/ShopStatusBanner';
import { MetricsGrid } from '@/src/components/analytics/MetricsGrid';
import { CustomerInsights } from '@/src/components/analytics/CustomerInsights';
import { OperationalPerformance } from '@/src/components/analytics/OperationalPerformance';
import { LoyaltyEngagement } from '@/src/components/analytics/LoyaltyEngagement';
import { CohortAnalysisSection } from '@/src/components/analytics/CohortAnalysis';
import { RetentionAnalysisSection } from '@/src/components/analytics/RetentionAnalysis';
import { CustomerLTVSection } from '@/src/components/analytics/CustomerLTV';
import { NoShowAnalysisSection } from '@/src/components/analytics/NoShowAnalysis';
import { useTenantStore } from '@/src/store/useTenantStore';
import { useTranslation } from 'react-i18next';
import { PopularServices } from '@/src/components/analytics/PopularServices';
import { useStaff } from '@/src/hooks/queries/useStaff';
import { useTheme } from '@/src/hooks/useTheme';

export default function AnalyticsScreen() {
  const {
    range,
    setRange,
    metrics,
    shopStatus,
    customerInsights,
    operationalPerformance,
    loyaltyEngagement,
  } = useAnalytics();

  const { t } = useTranslation();
  const { getBranding } = useTenantStore();
  const branding = getBranding();
  const { colors } = useTheme();

  const { data: staffList = [] } = useStaff();
  const activeStaff = staffList.filter((s) => s.status === 'active');

  const cohorts = useCohortAnalysis(6);
  const retention = useRetentionAnalysis();
  const ltv = useCustomerLTV();
  const noShows = useNoShowAnalysis();

  return (
    <Screen
      style={[styles.container, { backgroundColor: colors.background }]}
      scrollable={false}
      withPadding={false}
      headerTitle={branding?.name}
      showHeaderBack={true}
      headerSubtitle={t('nav.analytics')}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TimeRangeSelector currentRange={range} onRangeChange={setRange} />

        <ShopStatusBanner
          chairsActive={shopStatus.chairsActive}
          activeStaff={activeStaff}
        />

        <MetricsGrid metrics={metrics} />

        <CustomerInsights insights={customerInsights} />

        <OperationalPerformance
          staffUtilization={operationalPerformance.staffUtilization}
        />

        <PopularServices
          popularServices={operationalPerformance.popularServices}
        />

        <LoyaltyEngagement loyalty={loyaltyEngagement} />

        {/* Advanced Analytics */}
        <CohortAnalysisSection
          cohorts={cohorts.data?.cohorts ?? []}
          isLoading={cohorts.isLoading}
        />

        <RetentionAnalysisSection
          data={retention.data}
          isLoading={retention.isLoading}
          range={retention.range}
          onRangeChange={retention.setRange}
        />

        <CustomerLTVSection
          data={ltv.data}
          isLoading={ltv.isLoading}
          segmentBy={ltv.segmentBy}
          onSegmentChange={ltv.setSegmentBy}
        />

        <NoShowAnalysisSection
          data={noShows.data}
          isLoading={noShows.isLoading}
          range={noShows.range}
          onRangeChange={noShows.setRange}
        />

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SIZES.xl,
  },
});
