import { Stack, usePathname, useRouter } from 'expo-router';
import { ArrowLeft, X } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/src/components/ui';
import { COLORS, SIZES } from '@/src/constants/theme';
import { useBookingStore } from '@/src/store/useBookingStore';
import { useTenantStore } from '@/src/store/useTenantStore';

export default function BookingLayout() {
  const router = useRouter();
  const { t } = useTranslation();
  const pathname = usePathname();
  const { getBranding } = useTenantStore();
  const { primaryColor } = getBranding();
  const insets = useSafeAreaInsets();
  const resetBooking = useBookingStore((s) => s.reset);
  const isRebookMode = useBookingStore((s) => s.isRebookMode);

  const steps = isRebookMode
    ? [
        { path: 'slots', label: t('booking.steps.slots') },
        { path: 'review', label: t('booking.steps.review') },
      ]
    : [
        { path: 'services', label: t('booking.steps.services') },
        { path: 'slots', label: t('booking.steps.slots') },
        { path: 'staff', label: t('booking.steps.staff') },
        { path: 'review', label: t('booking.steps.review') },
      ];

  const currentStepIndex = steps.findIndex((s) => pathname.includes(s.path));

  const handleClose = () => {
    resetBooking();
    router.back();
  };

  const handleBack = () => {
    router.back();
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.topRow}>
        <TouchableOpacity
          onPress={currentStepIndex > 0 ? handleBack : handleClose}
          style={styles.iconButton}
        >
          {currentStepIndex > 0 ? (
            <ArrowLeft size={24} color={COLORS.text} pointerEvents="none" />
          ) : (
            <X size={24} color={COLORS.text} pointerEvents="none" />
          )}
        </TouchableOpacity>
        <Typography variant="h3" style={styles.title}>
          {isRebookMode
            ? t('booking.rebookAppointment')
            : t('booking.bookAppointment')}
        </Typography>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.progressContainer}>
        {steps.map((step, index) => {
          const isActive = index <= currentStepIndex;
          return (
            <View
              key={step.path}
              style={[
                styles.progressBar,
                {
                  backgroundColor: isActive ? primaryColor : COLORS.border,
                  flex: 1,
                  marginHorizontal: 2,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {currentStepIndex !== -1 && renderHeader()}
      <Stack
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        <Stack.Screen name="services" />
        <Stack.Screen name="staff" />
        <Stack.Screen name="slots" />
        <Stack.Screen name="review" />
        <Stack.Screen name="success" options={{ gestureEnabled: false }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.white,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.md,
    height: 48,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.md,
    paddingBottom: 12,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
});
