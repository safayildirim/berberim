import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SIZES } from '@/src/constants/theme';
import { Reward } from '@/src/types';
import { Typography } from '@/src/components/ui';
import { LoyaltyRewardCard } from './LoyaltyRewardCard';

interface LoyaltyRewardsSectionProps {
  rewards: Reward[];
  onRewardPress: (reward: Reward) => void;
  onViewAllPress: () => void;
}

export const LoyaltyRewardsSection: React.FC<LoyaltyRewardsSectionProps> = ({
  rewards,
  onRewardPress,
  onViewAllPress,
}) => {
  const { t } = useTranslation();

  // Find rewards for specific variants (for illustration based on design)
  const featuredReward = rewards.find((r) => r.pointsCost >= 150) || rewards[0];
  const smallRewards = rewards
    .filter((r) => r.id !== featuredReward?.id)
    .slice(0, 2);
  const horizontalReward =
    rewards.find((r) => r.pointsCost === 200) || rewards[3] || rewards[2];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h2" style={styles.title}>
          {t('loyalty.availableRewards')}
        </Typography>
        <TouchableOpacity onPress={onViewAllPress}>
          <Typography
            variant="label"
            style={styles.viewAllText}
            color="#000000"
          >
            {t('loyalty.viewAllPerks')}
          </Typography>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {featuredReward && (
          <View style={styles.featuredBox}>
            <LoyaltyRewardCard
              reward={featuredReward}
              variant="large"
              onPress={() => onRewardPress(featuredReward)}
            />
          </View>
        )}

        {smallRewards.length > 0 && (
          <View style={styles.smallGrid}>
            {smallRewards.map((reward) => (
              <LoyaltyRewardCard
                key={reward.id}
                reward={reward}
                variant="small"
                onPress={() => onRewardPress(reward)}
                style={styles.smallCardInGrid}
              />
            ))}
          </View>
        )}

        {horizontalReward && (
          <View style={styles.horizontalBox}>
            <LoyaltyRewardCard
              reward={horizontalReward}
              variant="horizontal"
              onPress={() => onRewardPress(horizontalReward)}
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1c1b1b',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  grid: {
    gap: 24,
  },
  featuredBox: {
    width: '100%',
  },
  smallGrid: {
    flexDirection: 'row',
    gap: 24,
    width: '100%',
  },
  smallCardInGrid: {
    flex: 1,
  },
  horizontalBox: {
    width: '100%',
  },
});
