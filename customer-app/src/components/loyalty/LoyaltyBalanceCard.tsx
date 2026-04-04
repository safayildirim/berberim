import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { COLORS, SIZES } from '@/src/constants/theme';
import { useTenantStore } from '@/src/store/useTenantStore';
import { LoyaltyWallet } from '@/src/types';
import { Typography } from '@/src/components/ui';

interface LoyaltyBalanceCardProps {
  wallet: LoyaltyWallet;
}

export const LoyaltyBalanceCard: React.FC<LoyaltyBalanceCardProps> = ({
  wallet,
}) => {
  const { t } = useTranslation();
  const { getBranding } = useTenantStore();
  const { primaryColor } = getBranding();
  const balance = wallet.current_points ?? 0;
  const rewardStep = 500;
  const nextRewardPoints = Math.max(
    rewardStep,
    Math.ceil((balance + 1) / rewardStep) * rewardStep,
  );
  const progress = Math.min(1, balance / nextRewardPoints);
  const remainingPoints = Math.max(0, nextRewardPoints - balance);

  return (
    <View style={[styles.card, { backgroundColor: primaryColor }]}>
      {/* Background Pattern - Grain/Abstract if available */}
      <View style={styles.content}>
        <View style={styles.topSection}>
          <Typography
            variant="label"
            style={styles.balanceLabel}
            color="rgba(255, 255, 255, 0.8)"
          >
            {t('loyalty.currentBalance').toUpperCase()}
          </Typography>
          <View style={styles.pointsContainer}>
            <Typography
              variant="h1"
              style={styles.pointsText}
              color={COLORS.white}
            >
              {balance}
            </Typography>
            <Typography
              variant="h3"
              style={styles.pointsUnit}
              color="rgba(255, 255, 255, 0.9)"
            >
              {t('loyalty.pointsLabel_plural')}
            </Typography>
          </View>
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.tierInfo}>
            <Typography
              variant="label"
              style={styles.tierName}
              color="rgba(255, 255, 255, 0.8)"
            >
              {t('loyalty.nextTier').toUpperCase()}: GOLD
            </Typography>
            <Typography
              variant="label"
              style={styles.percentText}
              color={COLORS.white}
            >
              {Math.round(progress * 100)}%
            </Typography>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${progress * 100}%` }]}
              />
            </View>
          </View>

          <Typography
            variant="body"
            style={styles.nextRewardNote}
            color="rgba(255, 255, 255, 0.7)"
          >
            {t('loyalty.progressNote_short', {
              remaining: remainingPoints,
              reward: 'Beard Sculpt',
            })}
          </Typography>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 40,
    overflow: 'hidden',
    marginHorizontal: SIZES.lg,
    padding: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
  },
  content: {
    gap: 32,
  },
  topSection: {
    gap: 8,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 2.8,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  pointsText: {
    fontSize: 72,
    fontWeight: '800',
    letterSpacing: -2,
    lineHeight: 80,
  },
  pointsUnit: {
    fontSize: 24,
    fontWeight: '600',
  },
  bottomSection: {
    width: '100%',
  },
  tierInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  tierName: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1.2,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  progressContainer: {
    height: 8,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 4,
  },
  nextRewardNote: {
    marginTop: 16,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
});
