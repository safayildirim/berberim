import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { SIZES } from '@/src/constants/theme';
import { Typography } from '@/src/components/ui';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/src/store/useThemeStore';

interface ReviewRatingSelectorProps {
  rating: number;
  onRatingChange: (rating: number) => void;
}

const GOLD = '#C5A059';

export const ReviewRatingSelector: React.FC<ReviewRatingSelectorProps> = ({
  rating,
  onRatingChange,
}) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  const handlePress = (newRating: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRatingChange(newRating);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceContainerLow,
          borderColor: colors.outlineVariant,
        },
      ]}
    >
      <Typography
        variant="caption"
        style={[styles.label, { color: colors.onSurfaceVariant }]}
      >
        {t('reviews.tap_to_rate', {
          defaultValue: 'Tap to rate',
        }).toUpperCase()}
      </Typography>
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handlePress(index)}
            activeOpacity={0.7}
            style={styles.starButton}
          >
            <Star
              size={48}
              fill={
                index <= rating
                  ? GOLD
                  : isDark
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(0,0,0,0.02)'
              }
              color={
                index <= rating ? GOLD : isDark ? colors.outline : colors.border
              }
              strokeWidth={2}
              pointerEvents="none"
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SIZES.xl,
    paddingHorizontal: SIZES.lg,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: SIZES.lg,
  },
  starRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  starButton: {
    padding: 2,
  },
});
