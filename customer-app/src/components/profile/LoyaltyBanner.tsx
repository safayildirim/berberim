import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SIZES } from '@/src/constants/theme';
import { Typography } from '@/src/components/ui';

interface LoyaltyBannerProps {
  balance: number;
  onViewCard: () => void;
  primaryColor: string;
  t: (key: string, options?: any) => string;
}

export const LoyaltyBanner: React.FC<LoyaltyBannerProps> = ({
  balance,
  onViewCard,
  primaryColor,
  t,
}) => {
  return (
    <View style={styles.container}>
      <Typography variant="caption" style={styles.label}>
        {t('loyalty.memberRewards').toUpperCase()}
      </Typography>
      <Text style={styles.point}>{balance}</Text>
      <Typography variant="h3" style={styles.title}>
        {t('loyalty.userPoints')}
      </Typography>
      <TouchableOpacity
        onPress={onViewCard}
        activeOpacity={0.7}
        style={styles.button}
      >
        <Typography
          variant="label"
          style={{ fontWeight: 'bold' }}
          color={primaryColor}
        >
          {t('loyalty.viewCard')}
        </Typography>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceContainerHighest,
    padding: 24,
    borderRadius: 32,
    alignItems: 'center',
    marginTop: SIZES.lg,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: COLORS.onSurfaceVariant,
    marginBottom: SIZES.sm,
  },
  point: {
    fontWeight: '800',
    fontSize: 72,
    color: COLORS.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  title: {
    fontWeight: '800',
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
