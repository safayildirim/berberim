import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS, TYPOGRAPHY, SIZES } from '@/src/constants/theme';

interface PopularServicesProps {
  popularServices: { name: string; count: number; progress: number }[];
}

export const PopularServices = ({ popularServices }: PopularServicesProps) => {
  const { t } = useTranslation();

  // Calculate median count
  const sortedCounts = [...popularServices]
    .map((s) => s.count)
    .sort((a, b) => a - b);
  const mid = Math.floor(sortedCounts.length / 2);
  const median =
    sortedCounts.length % 2 !== 0
      ? sortedCounts[mid]
      : (sortedCounts[mid - 1] + sortedCounts[mid]) / 2;

  const getBarColor = (count: number) => {
    // Relative to median calculation using a single color with varying opacity
    if (count > median * 1.2) return COLORS.primary; // High: 100% opacity
    if (count >= median * 0.8) return COLORS.primary + '99'; // Around Median: ~60% opacity
    return COLORS.primary + '4D'; // Below Median: ~30% opacity
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        {t('analytics.popularServices.title')}
      </Text>
      <View style={styles.servicesList}>
        {popularServices.slice(0, 3).map((service, index) => (
          <View key={index} style={styles.serviceRow}>
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceCount}>{service.count}</Text>
            </View>
            <View style={styles.serviceProgressTrack}>
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
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    paddingHorizontal: 4,
  },
  servicesList: {
    gap: 20,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + '15',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 16,
    elevation: 1,
  },
  serviceRow: {
    gap: 8,
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
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
  serviceCount: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  serviceProgressTrack: {
    height: 8, // Thicker bar as shown in image
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 4,
    overflow: 'hidden',
  },
  serviceProgressBar: {
    height: '100%',
    borderRadius: 4,
  },
});
