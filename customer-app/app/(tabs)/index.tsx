import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Screen } from '@/src/components/common/Screen';
import { useTheme } from '@/src/store/useThemeStore';
import { SIZES, getColors } from '@/src/constants/theme';
import { HomeHeader } from '@/src/components/home/HomeHeader';
import { HomeSearch } from '@/src/components/home/HomeSearch';
import { PrimaryBooking } from '@/src/components/home/PrimaryBooking';
import { UpcomingAppointment } from '@/src/components/home/UpcomingAppointment';
import { QuickRebook } from '@/src/components/home/QuickRebook';
import { LoyaltyCard } from '@/src/components/home/LoyaltyCard';
import { useHomeData } from '@/src/hooks/useHomeData';

export default function HomeScreen() {
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);
  const data = useHomeData();

  return (
    <Screen
      scrollable={false}
      transparentStatusBar
      style={{ backgroundColor: themeColors.background }}
    >
      <HomeHeader user={data.profile} location={data.location} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <HomeSearch />

        <PrimaryBooking
          earliestAvailable={data.bookingData.earliestAvailable}
          limitReached={data.bookingData.limitReached}
        />

        {data.upcomingAppointment && (
          <UpcomingAppointment appointment={data.upcomingAppointment} />
        )}

        {data.pastBooking && <QuickRebook pastBooking={data.pastBooking} />}

        <LoyaltyCard data={data.loyaltyData} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: SIZES.md,
  },
});
