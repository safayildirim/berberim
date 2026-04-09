import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
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
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const { data: allAppointments, isLoading, error } = useAppointments();
  const { mutate: cancelAppointment } = useCancelAppointment();
  const { mutateAsync: rebook } = useRebookAppointment();

  const filteredAppointments = (allAppointments?.appointments || [])
    .filter((a) => {
      if (activeTab === 'upcoming') {
        return (
          a.status === 'confirmed' ||
          a.status === 'rescheduled' ||
          a.status === 'pending'
        );
      }
      return (
        a.status === 'completed' ||
        a.status === 'cancelled' ||
        a.status === 'no_show'
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.starts_at).getTime();
      const dateB = new Date(b.starts_at).getTime();
      return activeTab === 'upcoming' ? dateA - dateB : dateB - dateA;
    });

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
      showProfile={false}
      error={error}
      transparentStatusBar
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <AppointmentSegmentedControl
            activeTab={activeTab}
            onTabChange={setActiveTab}
            upcomingLabel={t('appointments.upcoming')}
            pastLabel={t('appointments.past')}
          />

          <FlatList
            data={filteredAppointments}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <BookingCard
                booking={item}
                type={activeTab}
                onCancel={() => handleCancel(item.id)}
                onDetails={() => router.push(`/appointments/${item.id}`)}
                onReview={() => router.push(`/appointments/${item.id}/review`)}
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
                  {activeTab === 'upcoming'
                    ? t('appointments.noAppointmentsTitle')
                    : t('appointments.noPast')}
                </Typography>
                <Typography
                  variant="body"
                  style={[
                    styles.emptySubtitle,
                    { color: colors.onSurfaceVariant },
                  ]}
                >
                  {activeTab === 'upcoming'
                    ? t('appointments.noAppointmentsSubtitle')
                    : t('appointments.noPast')}
                </Typography>
              </View>
            }
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  list: {
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
