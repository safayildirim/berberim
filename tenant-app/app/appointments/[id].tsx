import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Bell, MoreHorizontal } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppointmentActionHub } from '../../src/components/appointments/details/AppointmentActionHub';
import { AppointmentBentoDetails } from '../../src/components/appointments/details/AppointmentBentoDetails';
import { AppointmentFinancialNotes } from '../../src/components/appointments/details/AppointmentFinancialNotes';
import { AppointmentHeader } from '../../src/components/appointments/details/AppointmentHeader';
import { Screen } from '../../src/components/common/Screen';
import { COLORS } from '../../src/constants/theme';
import { useAppointmentActions } from '../../src/hooks/appointments/useAppointmentActions';
import { useAppointmentDetail } from '../../src/hooks/queries/useAppointments';

export default function AppointmentDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    data: appointment,
    isLoading,
    isError,
  } = useAppointmentDetail(id as string);

  const actions = useAppointmentActions(id as string);

  if (isLoading) {
    return (
      <Screen style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </Screen>
    );
  }

  if (isError || !appointment) {
    return (
      <Screen style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {t('appointmentDetail.messages.loadError')}
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container} withPadding={false} transparentStatusBar>
      {/* Top App Bar */}
      <View style={[styles.topBar, { height: 80 }]}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.iconBtn}
          >
            <ArrowLeft size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>{t('appointmentDetail.title')}</Text>
        </View>
        <View style={styles.topBarRight}>
          <View style={styles.staffSmallAvatar}>
            {appointment.staff?.first_name ? (
              <Text style={styles.staffInitial}>
                {appointment.staff.first_name[0]}
              </Text>
            ) : (
              <MoreHorizontal size={16} color={COLORS.secondary} />
            )}
          </View>
          <TouchableOpacity style={styles.iconBtn}>
            <Bell size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 40 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <AppointmentHeader appointment={appointment} />

        <AppointmentBentoDetails appointment={appointment} />

        <AppointmentFinancialNotes appointment={appointment} />

        <AppointmentActionHub
          appointment={appointment}
          onComplete={actions.markCompleted}
          onPay={actions.markPaymentReceived}
          onNoShow={actions.markNoShow}
          onCancel={actions.cancelBooking}
          onReschedule={() =>
            router.push({
              pathname: '/appointments/reschedule' as any,
              params: { id: id as string },
            })
          }
          isCompleting={actions.isCompleting}
          isPaying={actions.isPaying}
          isMarkingNoShow={actions.isMarkingNoShow}
          isCancelling={actions.isCancelling}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f7f9fb',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '600',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  staffSmallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  staffInitial: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  scrollContent: {
    paddingTop: 24,
    paddingHorizontal: 24,
  },
});
