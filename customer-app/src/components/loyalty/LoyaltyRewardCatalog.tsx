import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Scissors, Coffee, Zap, Gift } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';
import { Reward } from '@/src/types';

interface LoyaltyRewardCatalogProps {
  rewards: Reward[];
  currentPoints: number;
  onRedeem: (reward: Reward) => void;
}

export const LoyaltyRewardCatalog = ({
  rewards,
  currentPoints,
  onRedeem,
}: LoyaltyRewardCatalogProps) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const getRewardIcon = (id: string) => {
    if (id.includes('haircut'))
      return {
        Icon: Scissors,
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.1)',
      };
    if (id.includes('coffee'))
      return { Icon: Coffee, color: '#92400e', bg: 'rgba(146, 64, 14, 0.1)' };
    if (id.includes('beard'))
      return { Icon: Zap, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' };
    return { Icon: Gift, color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)' };
  };

  return (
    <View style={styles.container}>
      <Typography
        variant="h3"
        style={[styles.sectionTitle, { color: colors.text }]}
      >
        {t('loyalty.availableRewards')}
      </Typography>

      <View style={styles.list}>
        {rewards.map((reward) => {
          const { Icon, color, bg } = getRewardIcon(reward.id);
          const canRedeem = currentPoints >= reward.pointsCost;

          return (
            <View
              key={reward.id}
              style={[
                styles.rewardCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.outlineVariant,
                },
              ]}
            >
              <View style={styles.rewardInfo}>
                <View style={[styles.iconContainer, { backgroundColor: bg }]}>
                  <Icon size={24} color={color} />
                </View>
                <View>
                  <Typography
                    style={[styles.rewardTitle, { color: colors.text }]}
                  >
                    {reward.title}
                  </Typography>
                  <Typography variant="caption" style={styles.pointsLabel}>
                    {reward.pointsCost} pts
                  </Typography>
                </View>
              </View>

              <TouchableOpacity
                disabled={!canRedeem}
                onPress={() => onRedeem(reward)}
                style={[
                  styles.redeemButton,
                  {
                    backgroundColor: canRedeem
                      ? isDark
                        ? colors.surfaceContainerHigh
                        : '#f4f4f5'
                      : isDark
                        ? colors.surfaceContainerLow
                        : '#fafafa',
                  },
                  !canRedeem && { opacity: 0.5 },
                ]}
              >
                <Typography
                  variant="label"
                  style={[
                    styles.redeemText,
                    {
                      color: canRedeem
                        ? colors.text
                        : isDark
                          ? colors.onSurfaceVariant
                          : '#a1a1aa',
                    },
                  ]}
                >
                  {t('loyalty.redeem')}
                </Typography>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  list: {
    gap: 12,
  },
  rewardCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rewardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  pointsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
    marginTop: 2,
  },
  redeemButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  redeemText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
