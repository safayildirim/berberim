import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Screen } from '@/src/components/common/Screen';
import { Typography } from '@/src/components/ui';
import {
  useCancelAppointment,
  useRebookAppointment,
} from '@/src/hooks/mutations/useAppointmentMutations';
import { useAppointments } from '@/src/hooks/queries/useAppointments';
import { useTheme } from '@/src/store/useThemeStore';
import { AppointmentSegmentedControl } from '@/src/components/appointments/AppointmentSegmentedControl';
import { BookingCard } from '@/src/components/appointments/BookingCard';
import { CalendarPlus } from 'lucide-react-native';

export default function AppointmentsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const { data: allAppointments, isLoading, error } = useAppointments();
  const { mutate: cancelAppointment } = useCancelAppointment();
  const { mutateAsync: rebook } = useRebookAppointment();

  const upcomingAppointments = (allAppointments?.appointments || [])
    .filter((a) => {
      return (
        a.status === 'confirmed' ||
        a.status === 'rescheduled' ||
        a.status === 'pending'
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.starts_at).getTime();
      const dateB = new Date(b.starts_at).getTime();
      return dateA - dateB;
    });

  const pastAppointments = (allAppointments?.appointments || [])
    .filter((a) => {
      return (
        a.status === 'completed' ||
        a.status === 'cancelled' ||
        a.status === 'no_show'
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.starts_at).getTime();
      const dateB = new Date(b.starts_at).getTime();
      return dateB - dateA;
    });

  const handleTabChange = (tab: 'upcoming' | 'past') => {
    setActiveTab(tab);
    scrollViewRef.current?.scrollTo({
      x: tab === 'upcoming' ? 0 : windowWidth,
      animated: true,
    });
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / windowWidth);
    const tab = index === 0 ? 'upcoming' : 'past';
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  };

  const handleCancel = (id: string) => {
    Alert.alert(
      t('appointments.cancelConfirmTitle'),
      t('appointments.cancelConfirmMsg'),
      [
        { text: t('appointments.cancelNo'), style: 'cancel' },
        {
          text: t('appointments.cancelYes'),
          style: 'destructive',
          onPress: () => cancelAppointment(id),
        },
      ],
    );
  };

  return (
    <Screen
      headerTitle={t('appointments.title')}
      loading={isLoading}
      error={error}
      transparentStatusBar
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.fixedContent}>
          <AppointmentSegmentedControl
            activeTab={activeTab}
            onTabChange={handleTabChange}
            upcomingLabel={t('appointments.upcoming')}
            pastLabel={t('appointments.past')}
          />
        </View>

        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
        >
          {/* Upcoming List */}
          <View style={{ width: windowWidth }}>
            <FlatList
              data={upcomingAppointments}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <BookingCard
                  booking={item}
                  type="upcoming"
                  onCancel={() => handleCancel(item.id)}
                  onDetails={() => router.push(`/appointments/${item.id}`)}
                  onReview={() =>
                    router.push(`/appointments/${item.id}/review`)
                  }
                  onRebook={() =>
                    rebook(item.id).then(() => router.push('/booking/slots'))
                  }
                />
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <View
                    style={[
                      styles.emptyIconContainer,
                      { backgroundColor: colors.surfaceContainer },
                    ]}
                  >
                    <CalendarPlus
                      size={48}
                      color={colors.onSurfaceVariant}
                      strokeWidth={1.5}
                      style={{ opacity: 0.4 }}
                    />
                  </View>
                  <Typography variant="h2" style={styles.emptyTitle}>
                    {t('appointments.noAppointmentsTitle')}
                  </Typography>
                  <Typography
                    variant="body"
                    style={[
                      styles.emptySubtitle,
                      { color: colors.onSurfaceVariant },
                    ]}
                  >
                    {t('appointments.noAppointmentsSubtitle')}
                  </Typography>
                </View>
              }
            />
          </View>

          {/* Past List */}
          <View style={{ width: windowWidth }}>
            <FlatList
              data={pastAppointments}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <BookingCard
                  booking={item}
                  type="past"
                  onCancel={() => handleCancel(item.id)}
                  onDetails={() => router.push(`/appointments/${item.id}`)}
                  onReview={() =>
                    router.push(`/appointments/${item.id}/review`)
                  }
                  onRebook={() =>
                    rebook(item.id).then(() => router.push('/booking/slots'))
                  }
                />
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <View
                    style={[
                      styles.emptyIconContainer,
                      { backgroundColor: colors.surfaceContainer },
                    ]}
                  >
                    <CalendarPlus
                      size={48}
                      color={colors.onSurfaceVariant}
                      strokeWidth={1.5}
                      style={{ opacity: 0.4 }}
                    />
                  </View>
                  <Typography variant="h2" style={styles.emptyTitle}>
                    {t('appointments.noPast')}
                  </Typography>
                  <Typography
                    variant="body"
                    style={[
                      styles.emptySubtitle,
                      { color: colors.onSurfaceVariant },
                    ]}
                  >
                    {t('appointments.noPast')}
                  </Typography>
                </View>
              }
            />
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedContent: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyState: {
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 24,
    marginBottom: 40,
    maxWidth: 280,
  },
});
