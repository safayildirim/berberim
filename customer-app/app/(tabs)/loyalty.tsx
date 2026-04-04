import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Screen } from '@/src/components/common/Screen';
import { LoyaltyActivityLedger } from '@/src/components/loyalty/LoyaltyActivityLedger';
import { LoyaltyBalanceCard } from '@/src/components/loyalty/LoyaltyBalanceCard';
import { LoyaltyRewardsSection } from '@/src/components/loyalty/LoyaltyRewardsSection';
import {
  useLoyaltyTransactions,
  useLoyaltyWallet,
  useRewards,
} from '@/src/hooks/queries/useLoyalty';
import { Reward } from '@/src/types';

export default function LoyaltyScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const { data: wallet, isLoading: isWalletLoading } = useLoyaltyWallet();
  const { data: transactions, isLoading: isTxLoading } =
    useLoyaltyTransactions();
  const { data: rewards, isLoading: isRewardsLoading } = useRewards();

  const handleRewardPress = (reward: Reward) => {
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

  const handleViewAllPerks = () => {
    router.push('/loyalty/rewards');
  };

  const isLoading = isWalletLoading || isTxLoading || isRewardsLoading;

  return (
    <Screen
      headerTitle={t('loyalty.title')}
      loading={isLoading}
      style={styles.screen}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {wallet && <LoyaltyBalanceCard wallet={wallet} />}

        {rewards && (
          <LoyaltyRewardsSection
            rewards={rewards}
            onRewardPress={handleRewardPress}
            onViewAllPress={handleViewAllPerks}
          />
        )}

        {transactions && <LoyaltyActivityLedger transactions={transactions} />}

        <View style={styles.footerSpacer} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#fdf8f8',
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 10,
    paddingBottom: 100, // Enough space for sticky bottom nav
  },
  footerSpacer: {
    height: 32,
  },
});
