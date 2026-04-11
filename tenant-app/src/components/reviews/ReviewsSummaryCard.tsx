import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { SHADOWS, TYPOGRAPHY } from '@/src/constants/theme';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/src/hooks/useTheme';

interface ReviewsSummaryCardProps {
  averageRating: number;
  totalCount: number;
}

export const ReviewsSummaryCard: React.FC<ReviewsSummaryCardProps> = ({
  averageRating,
  totalCount,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceContainerLowest,
          borderColor: colors.border + '15',
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.left}>
          <Text style={[styles.label, { color: colors.secondary }]}>
            {t('reviews.averageRating', 'Average Rating')}
          </Text>
          <View style={styles.ratingRow}>
            <Text style={[styles.value, { color: colors.primary }]}>
              {averageRating.toFixed(1)}
            </Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((s) => {
                const isSelected = s <= Math.floor(averageRating);
                const isHalf = !isSelected && s <= Math.ceil(averageRating);
                const fill = isSelected ? colors.primary : 'transparent';
                const color =
                  isSelected || isHalf ? colors.primary : colors.outline + '40';
                return (
                  <Star
                    key={s}
                    size={16}
                    color={color}
                    fill={fill}
                    strokeWidth={2}
                  />
                );
              })}
            </View>
          </View>
        </View>
        <View style={styles.right}>
          <Text style={[styles.label, { color: colors.secondary }]}>
            {t('reviews.totalCount', 'Total Count')}
          </Text>
          <Text style={[styles.value, { color: colors.primary }]}>
            {totalCount}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
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
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  value: {
    ...TYPOGRAPHY.h1,
    fontSize: 36,
    letterSpacing: -1,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 6,
  },
});
