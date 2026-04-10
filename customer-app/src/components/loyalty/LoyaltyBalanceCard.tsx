import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Award } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '@/src/components/ui';
import { LoyaltyWallet } from '@/src/types';

interface LoyaltyBalanceCardProps {
  wallet: LoyaltyWallet;
  tier?: string;
  nextRewardPoints?: number;
  nextRewardName?: string;
}

export const LoyaltyBalanceCard = ({
  wallet,
  tier,
  nextRewardPoints = 2500,
  nextRewardName,
}: LoyaltyBalanceCardProps) => {
  const { t } = useTranslation();
  const progress = Math.min(wallet.current_points / nextRewardPoints, 1);
  const remaining = Math.max(nextRewardPoints - wallet.current_points, 0);

  const displayTier = tier || t('loyalty.tier');
  const displayReward = nextRewardName || t('loyalty.nextReward');

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#18181b', '#09090b']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Glow Effect */}
        <View style={styles.glow} />

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['#fbbf24', '#d97706']}
              style={styles.awardCircle}
            >
              <Award size={32} color="#000" />
            </LinearGradient>
          </View>

          <Typography variant="caption" style={styles.tierText}>
            {displayTier.toUpperCase()}
          </Typography>

          <View style={styles.pointsContainer}>
            <Typography variant="h1" style={styles.pointsText}>
              {wallet.current_points.toLocaleString()}
            </Typography>
            <Typography variant="body" style={styles.ptsLabel}>
              {t('loyalty.pointsLabel_plural')}
            </Typography>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressLabels}>
              <Typography variant="caption" style={styles.label}>
                {t('loyalty.currentBalance')}
              </Typography>
              <Typography
                variant="caption"
                style={styles.nextRewardLabel}
                numberOfLines={1}
              >
                {t('loyalty.progressNote_short', {
                  reward: displayReward,
                  remaining: remaining,
                })}
              </Typography>
            </View>

            <View style={styles.progressBarBg}>
              <LinearGradient
                colors={['#d97706', '#fbbf24']}
                style={[
                  styles.progressBarFill,
                  { width: `${progress * 100}%` },
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    overflow: 'hidden',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  card: {
    padding: 28,
    paddingTop: 32,
    paddingBottom: 28,
    justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 80,
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: '#18181b',
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  awardCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierText: {
    color: '#a1a1aa',
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 24,
  },
  pointsText: {
    fontSize: 44,
    lineHeight: 52,
    fontWeight: '800',
    color: '#fff',
  },
  ptsLabel: {
    color: '#71717a',
    fontSize: 16,
  },
  progressSection: {
    width: '100%',
    gap: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    gap: 12,
  },
  label: {
    color: '#a1a1aa',
    fontWeight: '600',
  },
  nextRewardLabel: {
    color: '#f59e0b',
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
  progressBarBg: {
    width: '100%',
    height: 12,
    backgroundColor: '#27272a',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3f3f46',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
});
