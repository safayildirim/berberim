import { Lock, Star, Trophy } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';
import { Screen } from '@/src/components/common/Screen';
import { Button, Card, Typography } from '@/src/components/ui';
import { COLORS, SIZES } from '@/src/constants/theme';
import {
  useLoyaltyWallet,
  useRewards,
} from '../../src/hooks/queries/useLoyalty';
import { useTenantStore } from '../../src/store/useTenantStore';

export default function RewardsScreen() {
  const { t } = useTranslation();
  const { getBranding } = useTenantStore();
  const { primaryColor } = getBranding();

  const { data: rewards, isLoading: isRewardsLoading } = useRewards();
  const { data: wallet, isLoading: isWalletLoading } = useLoyaltyWallet();

  const handleRedeem = (reward: any) => {
    if (!reward.isAvailable) return;

    Alert.alert(
      t('loyalty.redeemConfirmTitle'),
      t('loyalty.redeemConfirmMsg', {
        title: reward.title,
        points: reward.pointsCost,
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('loyalty.redeemNow'),
          onPress: () => {
            Alert.alert(t('common.done'), t('loyalty.redeemSuccessMsg'));
          },
        },
      ],
    );
  };

  return (
    <Screen
      headerTitle={t('loyalty.availableRewards')}
      loading={isRewardsLoading || isWalletLoading}
      scrollable
    >
      <View style={[styles.walletCard, { backgroundColor: primaryColor }]}>
        <View style={styles.walletHeader}>
          <Trophy color={COLORS.white} size={28} />
          <View style={styles.walletText}>
            <Typography variant="h3" color={COLORS.white}>
              {t('loyalty.yourPointsBalance')}
            </Typography>
            <Typography
              variant="h1"
              color={COLORS.white}
              style={{ fontSize: 32 }}
            >
              {wallet?.current_points || 0}
            </Typography>
          </View>
        </View>
      </View>

      <Typography variant="h2" style={styles.title}>
        {t('loyalty.redeemYourPoints')}
      </Typography>
      <Typography
        variant="body"
        color={COLORS.secondary}
        style={styles.subtitle}
      >
        {t('loyalty.redeemSubtitle')}
      </Typography>

      <View style={styles.rewardsList}>
        {rewards?.map((reward) => {
          const canAfford = (wallet?.current_points || 0) >= reward.pointsCost;
          const isLocked = !canAfford || !reward.isAvailable;

          return (
            <Card
              key={reward.id}
              style={[styles.rewardCard, isLocked && { opacity: 0.8 }]}
              onPress={() => handleRedeem(reward)}
            >
              <View style={styles.rewardHeader}>
                <View
                  style={[
                    styles.rewardIcon,
                    {
                      backgroundColor: primaryColor + (isLocked ? '15' : '15'),
                    },
                  ]}
                >
                  {isLocked ? (
                    <Lock size={20} color={COLORS.secondary} />
                  ) : (
                    <Star size={20} color={primaryColor} fill={primaryColor} />
                  )}
                </View>
                <View style={styles.rewardInfo}>
                  <Typography variant="h3">{reward.title}</Typography>
                  <Typography variant="caption" color={COLORS.secondary}>
                    {reward.description}
                  </Typography>
                </View>
              </View>

              <View style={styles.rewardFooter}>
                <View
                  style={[
                    styles.pointsBadge,
                    {
                      backgroundColor: isLocked
                        ? COLORS.border
                        : primaryColor + '10',
                    },
                  ]}
                >
                  <Typography
                    variant="label"
                    color={isLocked ? COLORS.secondary : primaryColor}
                    style={{ fontWeight: '700' }}
                  >
                    {t('loyalty.pointsLabel', { count: reward.pointsCost })}
                  </Typography>
                </View>
                <Button
                  title={
                    isLocked ? t('loyalty.locked') : t('loyalty.redeemNow')
                  }
                  variant={isLocked ? 'ghost' : 'primary'}
                  size="sm"
                  onPress={() => handleRedeem(reward)}
                  disabled={isLocked}
                  style={styles.redeemButton}
                />
              </View>
            </Card>
          );
        })}
      </View>

      <View style={styles.infoSection}>
        <Typography variant="label" color={COLORS.secondary} align="center">
          {t('loyalty.infoNote')}
        </Typography>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  walletCard: {
    padding: SIZES.lg,
    borderRadius: SIZES.radius * 1.5,
    marginBottom: SIZES.xl,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletText: {
    marginLeft: SIZES.md,
  },
  title: {
    marginBottom: SIZES.xs,
  },
  subtitle: {
    marginBottom: SIZES.lg,
  },
  rewardsList: {
    gap: SIZES.md,
    marginBottom: SIZES.xl,
  },
  rewardCard: {
    padding: SIZES.md,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  rewardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardInfo: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  rewardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SIZES.md,
  },
  pointsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  redeemButton: {
    minWidth: 100,
  },
  infoSection: {
    paddingVertical: SIZES.lg,
    marginBottom: SIZES.xl,
  },
});
