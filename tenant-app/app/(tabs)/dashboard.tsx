import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/src/components/common/Screen';
import { DashboardNextAppointment } from '@/src/components/dashboard/DashboardNextAppointment';
import { DashboardOperationalHeader } from '@/src/components/dashboard/DashboardOperationalHeader';
import { DashboardQuickActions } from '@/src/components/dashboard/DashboardQuickActions';
import { DashboardShopInsights } from '@/src/components/dashboard/DashboardShopInsights';
import { DashboardStatsGrid } from '@/src/components/dashboard/DashboardStatsGrid';
import { useDashboard } from '@/src/hooks/dashboard/useDashboard';
import { useSessionStore } from '@/src/store/useSessionStore';
import { useTenantStore } from '@/src/store/useTenantStore';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/src/hooks/useTheme';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { isAdmin } = useSessionStore();
  const { getBranding } = useTenantStore();
  const branding = getBranding();

  const { t } = useTranslation();

  const { stats, nextAppointment, insights, isLoading } = useDashboard();

  return (
    <Screen
      style={[styles.container, { backgroundColor: colors.background }]}
      withPadding={false}
      transparentStatusBar
      headerTitle={branding.name}
      headerSubtitle={t('nav.dashboard')}
      showNotification
    >
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 40 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            <DashboardOperationalHeader activeChairs={4} />

            <DashboardStatsGrid
              completed={stats.completed}
              upcoming={stats.upcoming}
              noShows={stats.noShows}
            />

            <DashboardNextAppointment
              appointment={nextAppointment}
              primaryColor={colors.primary}
            />

            <DashboardQuickActions isAdmin={isAdmin()} />

            {isAdmin() && (
              <DashboardShopInsights
                revenue={insights.revenue ?? undefined}
                utilization={insights.utilization ?? undefined}
              />
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
