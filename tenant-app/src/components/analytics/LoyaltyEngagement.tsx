import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, Text } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SIZES } from '@/src/constants/theme';

interface LoyaltyEngagementProps {
  loyalty: {
    rewardsRedeemed: number;
    redeemedChange: string;
    progress: number;
  };
}

export const LoyaltyEngagement = ({ loyalty }: LoyaltyEngagementProps) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              {t('analytics.loyaltyEngagement.title')}
            </Text>
            <Text style={styles.subtitle}>
              {t('analytics.loyaltyEngagement.programTracking')}
            </Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {loyalty.progress}% {t('analytics.loyaltyEngagement.ofGoal')}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statsLeft}>
            <Text style={styles.value}>
              {loyalty.rewardsRedeemed.toLocaleString()}
            </Text>
            <Text style={styles.label}>
              {t('analytics.loyaltyEngagement.redeemed')}
            </Text>
          </View>
          <View style={styles.trendContainer}>
            <TrendingUp size={14} color="#059669" />
            <Text style={styles.trendText}>{loyalty.redeemedChange}</Text>
          </View>
        </View>

        <View style={styles.progressTrack}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryContainer]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBar, { width: `${loyalty.progress}%` }]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: SIZES.lg,
    paddingHorizontal: SIZES.md,
  },
  card: {
    backgroundColor: COLORS.surfaceContainerLow,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + '26', // ~15% opacity
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    ...TYPOGRAPHY.label,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.secondary,
    marginTop: 2,
  },
  badge: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  badgeText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statsLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  value: {
    ...TYPOGRAPHY.h2,
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.primary,
    lineHeight: 28,
  },
  label: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: '800',
    color: '#059669', // emerald-600
    textTransform: 'uppercase',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: '800',
    color: '#059669', // emerald-600
  },
  progressTrack: {
    height: 8,
    width: '100%',
    backgroundColor: COLORS.surfaceContainerHighest,
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 99,
  },
});
