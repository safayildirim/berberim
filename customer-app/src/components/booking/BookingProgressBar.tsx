import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';

interface BookingProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export const BookingProgressBar = ({
  currentStep,
  totalSteps,
}: BookingProgressBarProps) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.barContainer}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              {
                backgroundColor:
                  i <= currentStep ? '#f59e0b' : isDark ? '#27272a' : '#e5e7eb',
              },
            ]}
          />
        ))}
      </View>
      <Typography variant="caption" style={styles.label}>
        {t('booking.step')} {currentStep + 1} {t('booking.of')} {totalSteps}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  barContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  bar: {
    height: 4,
    flex: 1,
    borderRadius: 2,
  },
  label: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '800',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
