import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Screen } from '@/src/components/common/Screen';
import { LoyaltyBalanceCard } from '@/src/components/loyalty/LoyaltyBalanceCard';
import { LoyaltyRewardCatalog } from '@/src/components/loyalty/LoyaltyRewardCatalog';
import { LoyaltyPointsHistory } from '@/src/components/loyalty/LoyaltyPointsHistory';
import {
  useLoyaltyTransactions,
  useLoyaltyWallet,
  useRewards,
} from '@/src/hooks/queries/useLoyalty';
import { Reward } from '@/src/types';
import { useTheme } from '@/src/store/useThemeStore';

export default function LoyaltyScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const {
    data: wallet,
    isLoading: isWalletLoading,
    error: walletError,
  } = useLoyaltyWallet();
  const { data: transactions, isLoading: isTxLoading } =
    useLoyaltyTransactions();
  const { data: rewards, isLoading: isRewardsLoading } = useRewards();

  const handleRedeem = (reward: Reward) => {
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

  const isLoading = isWalletLoading || isTxLoading || isRewardsLoading;

  return (
    <Screen
      headerTitle={t('loyalty.title')}
      loading={isLoading}
      error={walletError}
      transparentStatusBar
      style={{ backgroundColor: colors.background }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          {wallet && (
            <LoyaltyBalanceCard
              wallet={wallet}
              tier={t('loyalty.tier')}
              nextRewardName={t('loyalty.nextReward')}
              nextRewardPoints={3000}
            />
          )}

          {rewards && wallet && (
            <LoyaltyRewardCatalog
              rewards={rewards}
              currentPoints={wallet.current_points}
              onRedeem={handleRedeem}
            />
          )}

          {transactions && <LoyaltyPointsHistory transactions={transactions} />}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  scrollContent: {
    paddingBottom: 100,
  },
});
