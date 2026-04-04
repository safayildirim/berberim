import { format, parseISO } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { Gift, Scissors, ShoppingBag, Star } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { COLORS, SIZES } from '@/src/constants/theme';
import { LoyaltyTransaction } from '@/src/types';
import { Typography } from '@/src/components/ui';

interface LoyaltyActivityLedgerProps {
  transactions: LoyaltyTransaction[];
}

const ActivityIcon = ({
  type,
  description,
  color,
}: {
  type: string;
  description: string;
  color: string;
}) => {
  const desc = description.toLowerCase();
  if (type === 'redeemed') {
    return <Gift size={24} color={COLORS.error} />;
  }
  if (desc.includes('scissor') || desc.includes('cut')) {
    return <Scissors size={24} color={color} />;
  }
  if (desc.includes('product') || desc.includes('purchase')) {
    return <ShoppingBag size={24} color={color} />;
  }
  if (desc.includes('referral') || desc.includes('reward')) {
    return <Star size={24} color={color} />;
  }
  return <Star size={24} color={color} />;
};

const getStatusText = (type: string, description: string) => {
  const desc = description.toLowerCase();
  if (type === 'redeemed') return 'REWARD CLAIMED';
  if (desc.includes('scissor') || desc.includes('cut')) return 'VERIFIED VISIT';
  if (desc.includes('product') || desc.includes('purchase'))
    return 'RETAIL BONUS';
  if (desc.includes('referral') || desc.includes('reward'))
    return 'NETWORK BONUS';
  return 'VERIFIED VISIT';
};

export const LoyaltyActivityLedger: React.FC<LoyaltyActivityLedgerProps> = ({
  transactions,
}) => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language.startsWith('tr') ? tr : enUS;

  return (
    <View style={styles.container}>
      <Typography variant="h2" style={styles.title}>
        {t('loyalty.activityLedger')}
      </Typography>

      <View style={styles.ledgerBox}>
        <View style={styles.itemsList}>
          {transactions.map((tx, index) => {
            const isRedeemed = tx.type === 'redeemed';
            return (
              <View key={tx.id} style={styles.activityRow}>
                <View style={styles.rowLeft}>
                  <View
                    style={[
                      styles.iconContainer,
                      {
                        backgroundColor: isRedeemed
                          ? COLORS.error + '15'
                          : '#f1edec',
                      },
                    ]}
                  >
                    <ActivityIcon
                      type={tx.type}
                      description={tx.description}
                      color="#000000"
                    />
                  </View>
                  <View style={styles.info}>
                    <Typography variant="h3" style={styles.txTitle}>
                      {tx.description}
                    </Typography>
                    <Typography
                      variant="label"
                      style={styles.txDate}
                      color={COLORS.secondary}
                    >
                      {format(parseISO(tx.date), 'MMM d, yyyy', {
                        locale: dateLocale,
                      }).toUpperCase()}
                    </Typography>
                  </View>
                </View>

                <View style={styles.rowRight}>
                  <Typography
                    variant="h3"
                    style={styles.pointsText}
                    color={isRedeemed ? COLORS.error : '#000000'}
                  >
                    {isRedeemed ? '-' : '+'}
                    {tx.points} PTS
                  </Typography>
                  <Typography
                    variant="label"
                    style={styles.statusText}
                    color={COLORS.secondary}
                  >
                    {getStatusText(tx.type, tx.description)}
                  </Typography>
                </View>
              </View>
            );
          })}
        </View>

        <TouchableOpacity style={styles.showAllButton}>
          <Typography
            variant="label"
            style={styles.showAllText}
            color={COLORS.secondary}
          >
            {t('loyalty.showFullLedger').toUpperCase()}
          </Typography>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: SIZES.lg,
    color: '#1c1b1b',
  },
  ledgerBox: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 16,
    shadowColor: '#2a3439',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.03,
    shadowRadius: 32,
    elevation: 2,
  },
  itemsList: {
    gap: 8,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1b1b',
    marginBottom: 2,
  },
  txDate: {
    fontSize: 12,
    letterSpacing: 1.2,
    fontWeight: '500',
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  statusText: {
    fontSize: 10,
    letterSpacing: -0.5,
    fontWeight: '500',
  },
  showAllButton: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1edec',
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  showAllText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2.4,
  },
});
