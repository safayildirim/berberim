import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, Text } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { SHADOWS, TYPOGRAPHY, SIZES } from '@/src/constants/theme';
import { useTheme } from '@/src/hooks/useTheme';

interface OperationalPerformanceProps {
  staffUtilization: number;
}

export const OperationalPerformance = ({
  staffUtilization,
}: OperationalPerformanceProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const getStatusColor = (val: number) => {
    if (val > 85) return colors.warning;
    if (val > 60) return colors.success;
    return colors.secondary;
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>
        {t('analytics.operationalPerformance.title').toUpperCase()}
      </Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border + '15' }]}>
        <AnimatedCircularProgress
          size={140}
          width={14}
          fill={staffUtilization}
          tintColor={getStatusColor(staffUtilization)}
          backgroundColor={getStatusColor(staffUtilization) + '15'}
          rotation={0}
          lineCap="round"
        >
          {() => (
            <Text style={[styles.utilizationText, { color: colors.primary }]}>{staffUtilization}%</Text>
          )}
        </AnimatedCircularProgress>
        <View style={styles.infoContainer}>
          <Text style={[styles.label, { color: colors.primary }]}>
            {t('analytics.operationalPerformance.staffUtilization')}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: SIZES.lg,
    paddingHorizontal: SIZES.md,
    gap: 12,
  },
  sectionTitle: {
    ...TYPOGRAPHY.label,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
    paddingHorizontal: 4,
  },
  card: {
    alignItems: 'center',
    borderRadius: 32,
    padding: 32,
    borderWidth: 1,
    ...SHADOWS.sm,
    gap: 24,
  },
  utilizationText: {
    ...TYPOGRAPHY.h1,
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 36,
  },
  infoContainer: {
    alignItems: 'center',
    gap: 6,
  },
  label: {
    ...TYPOGRAPHY.h3,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
});

