import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Star } from 'lucide-react-native';
import { COLORS } from '@/src/constants/theme';
import { Typography } from '@/src/components/ui';

interface StarRatingDisplayProps {
  rating: number;
  reviewCount?: number;
  size?: number;
  showCount?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const StarRatingDisplay: React.FC<StarRatingDisplayProps> = ({
  rating,
  reviewCount,
  size = 14,
  showCount = true,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Star
        size={size}
        fill={COLORS.warning}
        color={COLORS.warning}
        strokeWidth={0}
      />
      <Typography variant="label" style={styles.ratingText}>
        {rating.toFixed(1)}
      </Typography>
      {showCount && typeof reviewCount === 'number' && (
        <Typography
          variant="caption"
          color={COLORS.secondary}
          style={styles.countText}
        >
          ({reviewCount})
        </Typography>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: '700',
  },
  countText: {
    marginLeft: 2,
  },
});
