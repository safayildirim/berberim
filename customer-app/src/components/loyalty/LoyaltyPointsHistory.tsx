import React from 'react';
import { StyleSheet, View } from 'react-native';
import { History } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';
import { LoyaltyTransaction } from '@/src/types';

interface LoyaltyPointsHistoryProps {
  transactions: LoyaltyTransaction[];
}

export const LoyaltyPointsHistory = ({
  transactions,
}: LoyaltyPointsHistoryProps) => {
  const { colors, isDark } = useTheme();
  const { t, i18n } = useTranslation();

  const locale = i18n.language.startsWith('tr') ? tr : enUS;

  return (
    <View style={styles.container}>
      <Typography
        variant="h3"
        style={[styles.sectionTitle, { color: colors.text }]}
      >
        {t('loyalty.activityLedger')}
      </Typography>

      <View
        style={[
          styles.listContainer,
          {
            backgroundColor: colors.card,
            borderColor: colors.outlineVariant,
          },
        ]}
      >
        {transactions.map((item, index) => {
          const isLast = index === transactions.length - 1;
          const formattedDate = format(parseISO(item.date), 'MMM d, yyyy', {
            locale,
          });
          const isPositive = item.type === 'earned';

          return (
            <View
              key={item.id}
              style={[
                styles.transactionItem,
                !isLast && {
                  borderBottomWidth: 1,
                  borderBottomColor: isDark
                    ? 'rgba(255,255,255,0.05)'
                    : '#f4f4f5',
                },
              ]}
            >
              <View style={styles.leftSection}>
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.03)'
                        : '#f9fafb',
                    },
                  ]}
                >
                  <History size={16} color={colors.onSurfaceVariant} />
                </View>
                <View>
                  <Typography
                    style={[styles.actionText, { color: colors.text }]}
                  >
                    {item.description}
                  </Typography>
                  <Typography variant="caption" style={styles.dateText}>
                    {formattedDate}
                  </Typography>
                </View>
              </View>

              <Typography
                style={[
                  styles.pointsValue,
                  {
                    color: isPositive
                      ? isDark
                        ? '#4ade80'
                        : '#16a34a'
                      : colors.text,
                  },
                ]}
              >
                {isPositive ? `+${item.points}` : `-${item.points}`}
              </Typography>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  listContainer: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 2,
  },
  pointsValue: {
    fontSize: 14,
    fontWeight: '800',
  },
});
