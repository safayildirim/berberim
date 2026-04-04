import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { COLORS, SHADOWS, TYPOGRAPHY } from '@/src/constants/theme';
import { useTranslation } from 'react-i18next';

interface ReviewsSummaryCardProps {
  averageRating: number;
  totalCount: number;
}

export const ReviewsSummaryCard: React.FC<ReviewsSummaryCardProps> = ({
  averageRating,
  totalCount,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.left}>
          <Text style={styles.label}>
            {t('reviews.averageRating', 'Average Rating')}
          </Text>
          <View style={styles.ratingRow}>
            <Text style={styles.value}>{averageRating.toFixed(1)}</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((s) => {
                const fill =
                  s <= Math.floor(averageRating) ? '#fc4f45' : 'transparent';
                const color =
                  s <= Math.ceil(averageRating)
                    ? '#fc4f45'
                    : COLORS.surfaceContainerHighest;
                return (
                  <Star
                    key={s}
                    size={14}
                    color={color}
                    fill={fill}
                    strokeWidth={1.5}
                  />
                );
              })}
            </View>
          </View>
        </View>
        <View style={styles.right}>
          <Text style={styles.label}>
            {t('reviews.totalCount', 'Total Count')}
          </Text>
          <Text style={styles.value}>{totalCount}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + '10',
    marginBottom: 24,
    ...SHADOWS.sm,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  left: {
    gap: 4,
  },
  right: {
    alignItems: 'flex-end',
    gap: 0,
  },
  label: {
    ...TYPOGRAPHY.caption,
    color: COLORS.onSecondaryContainer,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  value: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primary,
    fontSize: 32,
    fontWeight: '800',
  },
  stars: {
    flexDirection: 'row',
    gap: 1,
    marginBottom: 4,
  },
});
