import { Stack, usePathname, useRouter } from 'expo-router';
import { ArrowLeft, X } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/src/components/ui';
import { useBookingStore } from '@/src/store/useBookingStore';
import { useTheme } from '@/src/store/useThemeStore';
import { BookingProgressBar } from '@/src/components/booking/BookingProgressBar';

export default function BookingLayout() {
  const router = useRouter();
  const { t } = useTranslation();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { reset: resetBooking, isRebookMode } = useBookingStore();

  const steps = isRebookMode
    ? ['slots', 'review']
    : ['services', 'slots', 'staff', 'review'];

  const currentStepIndex = steps.findIndex((s) => pathname.includes(s));
  const isSuccessScreen = pathname.includes('success');

  const handleClose = () => {
    resetBooking();
    router.replace('/(tabs)');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {!isSuccessScreen && currentStepIndex !== -1 && (
        <View
          style={[
            styles.header,
            {
              paddingTop: Math.max(insets.top, 20),
              borderBottomColor: colors.outlineVariant,
              backgroundColor: isDark
                ? 'rgba(9, 9, 11, 0.9)'
                : 'rgba(255, 255, 255, 0.9)',
            },
          ]}
        >
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={currentStepIndex > 0 ? handleBack : handleClose}
              style={[
                styles.iconButton,
                { backgroundColor: isDark ? '#18181b' : '#f4f4f5' },
              ]}
            >
              {currentStepIndex > 0 ? (
                <ArrowLeft size={20} color={colors.text} />
              ) : (
                <X size={20} color={colors.text} />
              )}
            </TouchableOpacity>
            <Typography
              variant="h3"
              style={[styles.title, { color: colors.text }]}
            >
              {t('booking.bookAppointment')}
            </Typography>
            <View style={{ width: 40 }} />
          </View>

          <BookingProgressBar
            currentStep={currentStepIndex}
            totalSteps={steps.length}
          />
        </View>
      )}

      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: 'transparent' },
        }}
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
  },
  header: {
    borderBottomWidth: 1,
    zIndex: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
});
