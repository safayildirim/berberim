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
import { AppointmentActionHub } from '@/src/components/appointments/details/AppointmentActionHub';
import { AppointmentBentoDetails } from '@/src/components/appointments/details/AppointmentBentoDetails';
import { AppointmentFinancialNotes } from '@/src/components/appointments/details/AppointmentFinancialNotes';
import { AppointmentHeader } from '@/src/components/appointments/details/AppointmentHeader';
import { Screen } from '@/src/components/common/Screen';
import { useAppointmentActions } from '@/src/hooks/appointments/useAppointmentActions';
import { useAppointmentDetail } from '@/src/hooks/queries/useAppointments';
import { useTheme } from '@/src/hooks/useTheme';
import { TYPOGRAPHY } from '@/src/constants/theme';

export default function AppointmentDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const {
    data: appointment,
    isLoading,
    isError,
  } = useAppointmentDetail(id as string);

  const actions = useAppointmentActions(id as string);

  const isTerminal =
    appointment?.status === 'completed' ||
    appointment?.status === 'cancelled' ||
    appointment?.status === 'no_show';

  if (isLoading) {
    return (
      <Screen style={styles.container} withPadding={false}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (isError || !appointment) {
    return (
      <Screen style={styles.container} withPadding={false}>
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {t('appointmentDetail.messages.loadError')}
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      style={[styles.container, { backgroundColor: colors.background }]}
      withPadding={false}
      transparentStatusBar
    >
      {/* Top App Bar (Glass Effect) */}
      <View
        style={[
          styles.topBar,
          {
            height: 60 + insets.top,
            paddingTop: insets.top,
            backgroundColor: colors.background + 'F2',
            borderBottomColor: colors.border + '10',
          },
        ]}
      >
        <View style={styles.topBarLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.iconBtn,
              { backgroundColor: colors.surfaceContainerLow },
            ]}
          >
            <ArrowLeft size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.topBarTitle, { color: colors.primary }]}>
            {t('appointmentDetail.title')}
          </Text>
        </View>
        <View style={styles.topBarRight}>
          <View
            style={[
              styles.staffSmallAvatar,
              { backgroundColor: colors.primary + '15' },
            ]}
          >
            {appointment.staff?.first_name ? (
              <Text style={[styles.staffInitial, { color: colors.primary }]}>
                {appointment.staff.first_name[0]}
              </Text>
            ) : (
              <MoreHorizontal size={14} color={colors.secondary} />
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.iconBtn,
              { backgroundColor: colors.surfaceContainerLow },
            ]}
          >
            <Bell size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: isTerminal
              ? 40 + insets.bottom
              : 120 + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <AppointmentHeader appointment={appointment} />

        <AppointmentBentoDetails appointment={appointment} />

        <AppointmentFinancialNotes appointment={appointment} />
      </ScrollView>

      {!isTerminal && (
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
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topBarTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 18,
    letterSpacing: -0.5,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  staffSmallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  staffInitial: {
    ...TYPOGRAPHY.caption,
    fontWeight: '900',
    fontSize: 12,
  },
  scrollContent: {
    paddingTop: 24,
    paddingHorizontal: 24,
  },
});
