import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, Text } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { COLORS, TYPOGRAPHY, SIZES } from '@/src/constants/theme';

interface OperationalPerformanceProps {
  staffUtilization: number;
}

export const OperationalPerformance = ({
  staffUtilization,
}: OperationalPerformanceProps) => {
  const { t } = useTranslation();

  const getStatusColor = (val: number) => {
    if (val > 85) return COLORS.warning; // High/Overworked
    if (val > 60) return COLORS.success; // Optimal
    return COLORS.secondary; // Underutilized
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        {t('analytics.operationalPerformance.title')}
      </Text>
      <View style={styles.card}>
        <AnimatedCircularProgress
          size={120}
          width={12}
          fill={staffUtilization}
          tintColor={getStatusColor(staffUtilization)}
          backgroundColor={getStatusColor(staffUtilization) + '20'}
          rotation={0}
          lineCap="round"
        >
          {() => (
            <Text style={styles.utilizationText}>{staffUtilization}%</Text>
          )}
        </AnimatedCircularProgress>
        <View style={styles.infoContainer}>
          <Text style={styles.label}>
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
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    paddingHorizontal: 4,
  },
  card: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 32,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + '15',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 32,
    elevation: 2,
    gap: 20,
  },
  utilizationText: {
    ...TYPOGRAPHY.h1,
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.primary,
    lineHeight: 32,
  },
  infoContainer: {
    alignItems: 'center',
    gap: 6,
  },
  label: {
    ...TYPOGRAPHY.h3,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
});
