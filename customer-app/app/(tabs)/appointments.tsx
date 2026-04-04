import { useRouter } from 'expo-router';
import { CalendarPlus } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppointmentListItem } from '@/src/components/appointments/AppointmentListItem';
import { Screen } from '@/src/components/common/Screen';
import { Typography } from '@/src/components/ui';
import { COLORS, SHADOWS, SIZES } from '@/src/constants/theme';
import {
  useCancelAppointment,
  useRebookAppointment,
} from '@/src/hooks/mutations/useAppointmentMutations';
import { useAppointments } from '@/src/hooks/queries/useAppointments';

export default function AppointmentsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
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
      error={error}
      transparentStatusBar
    >
      <View style={styles.container}>
        {/* Pill Tab Interface */}
        <View style={styles.tabWrapper}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveTab('upcoming')}
              style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
            >
              <Typography
                variant="label"
                style={[
                  styles.tabText,
                  activeTab === 'upcoming' && styles.activeTabText,
                ]}
              >
                {t('appointments.upcoming')}
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setActiveTab('past')}
              style={[styles.tab, activeTab === 'past' && styles.activeTab]}
            >
              <Typography
                variant="label"
                style={[
                  styles.tabText,
                  activeTab === 'past' && styles.activeTabText,
                ]}
              >
                {t('appointments.past')}
              </Typography>
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={filteredAppointments}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            activeTab === 'past' && filteredAppointments.length > 0 ? (
              <View style={styles.sectionHeader}>
                <Typography variant="caption" style={styles.sectionTitle}>
                  {t('appointments.sectionCompletedRecently')}
                </Typography>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <AppointmentListItem
              appointment={item}
              showActions
              onPress={() => router.push(`/appointments/${item.id}`)}
              onCancel={() => handleCancel(item.id)}
              onRebook={() =>
                rebook(item.id).then(() => router.push('/booking/slots'))
              }
              onReview={() => router.push(`/appointments/${item.id}/review`)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <CalendarPlus
                  size={48}
                  color={COLORS.onSurfaceVariant}
                  strokeWidth={1.5}
                  style={{ opacity: 0.4 }}
                />
              </View>
              <Typography variant="h2" style={styles.emptyTitle}>
                {activeTab === 'upcoming'
                  ? t('appointments.noAppointmentsTitle')
                  : t('appointments.noPast')}
              </Typography>
              <Typography variant="body" style={styles.emptySubtitle}>
                {activeTab === 'upcoming'
                  ? t('appointments.noAppointmentsSubtitle')
                  : t('appointments.noPast')}
              </Typography>
              {activeTab === 'upcoming' && (
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.emptyCTA}
                  onPress={() => router.push('/booking/services')}
                >
                  <Typography
                    variant="label"
                    color={COLORS.white}
                    style={styles.emptyCTAText}
                  >
                    {t('booking.bookAppointment')}
                  </Typography>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: SIZES.md,
    paddingHorizontal: SIZES.padding,
  },
  tabWrapper: {
    padding: 6,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 20,
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 14,
  },
  activeTab: {
    backgroundColor: COLORS.surfaceContainerLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  activeTabText: {
    color: COLORS.text,
  },
  list: {
    paddingBottom: 100,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontWeight: '800',
    letterSpacing: 1.5,
    color: COLORS.onSurfaceVariant,
    opacity: 0.6,
  },
  emptyState: {
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.surfaceContainerHigh,
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
    color: COLORS.onSurfaceVariant,
    opacity: 0.8,
    lineHeight: 24,
    marginBottom: 40,
    maxWidth: 280,
  },
  emptyCTA: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  emptyCTAText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
