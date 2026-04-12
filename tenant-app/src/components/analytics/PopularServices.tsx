import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, Text } from 'react-native';
import { SHADOWS, TYPOGRAPHY, SIZES } from '@/src/constants/theme';
import { useTheme } from '@/src/hooks/useTheme';

interface PopularServicesProps {
  popularServices: { name: string; count: number; progress: number }[];
}

export const PopularServices = ({ popularServices }: PopularServicesProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const sortedCounts = [...popularServices]
    .map((s) => s.count)
    .sort((a, b) => a - b);
  const mid = Math.floor(sortedCounts.length / 2);
  const median =
    sortedCounts.length % 2 !== 0
      ? sortedCounts[mid]
      : (sortedCounts[mid - 1] + sortedCounts[mid]) / 2;

  const getBarColor = (count: number) => {
    if (count > median * 1.2) return colors.primary;
    if (count >= median * 0.8) return colors.primary + '99';
    return colors.primary + '4D';
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>
        {t('analytics.popularServices.title').toUpperCase()}
      </Text>
      <View
        style={[
          styles.servicesList,
          { backgroundColor: colors.card, borderColor: colors.border + '15' },
        ]}
      >
        {popularServices.slice(0, 3).map((service, index) => (
          <View key={index} style={styles.serviceRow}>
            <View style={styles.serviceHeader}>
              <Text style={[styles.serviceName, { color: colors.primary }]}>
                {service.name}
              </Text>
              <Text style={[styles.serviceCount, { color: colors.primary }]}>
                {service.count}
              </Text>
            </View>
            <View
              style={[
                styles.serviceProgressTrack,
                { backgroundColor: colors.surfaceContainerLow },
              ]}
            >
              <View
                style={[
                  styles.serviceProgressBar,
                  {
                    width: `${service.progress * 100}%`,
                    backgroundColor: getBarColor(service.count),
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: SIZES.lg,
    paddingHorizontal: SIZES.md,
    gap: 16,
  },
  sectionTitle: {
    ...TYPOGRAPHY.label,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
    paddingHorizontal: 4,
  },
  servicesList: {
    gap: 24,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  serviceRow: {
    gap: 10,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  serviceName: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  serviceCount: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    fontWeight: '900',
  },
  serviceProgressTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  serviceProgressBar: {
    height: '100%',
    borderRadius: 5,
  },
});
