import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, Text } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SHADOWS, TYPOGRAPHY, SIZES } from '@/src/constants/theme';
import { useTheme } from '@/src/hooks/useTheme';

interface LoyaltyEngagementProps {
  loyalty: {
    rewardsRedeemed: number;
    redeemedChange: string;
    progress: number;
  };
}

export const LoyaltyEngagement = ({ loyalty }: LoyaltyEngagementProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border + '15' },
        ]}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.primary }]}>
              {t('analytics.loyaltyEngagement.title').toUpperCase()}
            </Text>
            <Text style={[styles.subtitle, { color: colors.secondary }]}>
              {t('analytics.loyaltyEngagement.programTracking')}
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              { backgroundColor: colors.surfaceContainerLow },
            ]}
          >
            <Text style={[styles.badgeText, { color: colors.primary }]}>
              {loyalty.progress}% {t('analytics.loyaltyEngagement.ofGoal')}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statsLeft}>
            <Text style={[styles.value, { color: colors.primary }]}>
              {loyalty.rewardsRedeemed.toLocaleString()}
            </Text>
            <Text style={[styles.label, { color: colors.success }]}>
              {t('analytics.loyaltyEngagement.redeemed')}
            </Text>
          </View>
          <View style={styles.trendContainer}>
            <TrendingUp size={14} color={colors.success} />
            <Text style={[styles.trendText, { color: colors.success }]}>
              {loyalty.redeemedChange}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.progressTrack,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryContainer]}
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
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    ...TYPOGRAPHY.label,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  subtitle: {
    ...TYPOGRAPHY.label,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
    fontWeight: '900',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statsLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  value: {
    ...TYPOGRAPHY.h2,
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 28,
  },
  label: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    ...TYPOGRAPHY.label,
    fontSize: 11,
    fontWeight: '900',
  },
  progressTrack: {
    height: 12,
    width: '100%',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
});
