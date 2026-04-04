import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SIZES } from '@/src/constants/theme';
import { Typography } from '@/src/components/ui';
import { useTranslation } from 'react-i18next';

interface ReviewRatingSelectorProps {
  rating: number;
  onRatingChange: (rating: number) => void;
}

export const ReviewRatingSelector: React.FC<ReviewRatingSelectorProps> = ({
  rating,
  onRatingChange,
}) => {
  const { t } = useTranslation();

  const handlePress = (newRating: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRatingChange(newRating);
  };

  return (
    <View style={styles.container}>
      <Typography variant="caption" style={styles.label}>
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
              fill={index <= rating ? '#C5A059' : 'rgba(0,0,0,0.02)'}
              color={index <= rating ? '#C5A059' : '#C4C7C7'}
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
    backgroundColor: COLORS.surfaceContainerLow,
    paddingVertical: SIZES.xl,
    paddingHorizontal: SIZES.lg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
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
