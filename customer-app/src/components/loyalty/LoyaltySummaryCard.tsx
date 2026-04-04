import { Star, Trophy } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { COLORS, SIZES } from '@/src/constants/theme';
import { useTenantStore } from '@/src/store/useTenantStore';
import { LoyaltyWallet } from '@/src/types';
import { Button, Card, Typography } from '@/src/components/ui';

interface LoyaltySummaryCardProps {
  wallet: LoyaltyWallet;
  onPress?: () => void;
  onRedeemPress?: () => void;
}

export const LoyaltySummaryCard: React.FC<LoyaltySummaryCardProps> = ({
  wallet,
  onPress,
  onRedeemPress,
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

  return (
    <Card
      onPress={onPress}
      style={[styles.card, { backgroundColor: primaryColor }]}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Trophy color={COLORS.white} size={24} />
        </View>
        <Typography variant="h3" color={COLORS.white} style={styles.title}>
          {t('loyalty.title')}
        </Typography>
      </View>

      <View style={styles.pointsContainer}>
        <Typography variant="h1" color={COLORS.white} style={{ fontSize: 36 }}>
          {balance}
        </Typography>
        <Typography
          variant="label"
          color={COLORS.white}
          style={styles.pointsLabel}
        >
          {t('loyalty.pointsAvailable')}
        </Typography>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Typography variant="caption" color={COLORS.white}>
            {t('loyalty.progressNote', {
              current: balance,
              total: nextRewardPoints,
            })}
          </Typography>
        </View>
        <View
          style={[
            styles.progressBar,
            { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
                backgroundColor: COLORS.white,
              },
            ]}
          />
        </View>
      </View>

      <Button
        title={t('loyalty.viewRewards')}
        variant="ghost"
        onPress={onRedeemPress || (() => {})}
        style={styles.redeemButton}
        titleStyle={{ color: COLORS.white }}
        size="sm"
        icon={<Star size={16} color={COLORS.white} />}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: SIZES.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  iconContainer: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  title: {
    marginLeft: SIZES.sm,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SIZES.lg,
  },
  pointsLabel: {
    marginLeft: 8,
    opacity: 0.8,
  },
  progressContainer: {
    marginBottom: SIZES.lg,
  },
  progressHeader: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  redeemButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignSelf: 'flex-start',
  },
});
