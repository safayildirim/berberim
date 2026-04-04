import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/src/constants/theme';

interface StarRatingInputProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: number;
}

export const StarRatingInput: React.FC<StarRatingInputProps> = ({
  rating,
  onRatingChange,
  size = 32,
}) => {
  const handlePress = (newRating: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRatingChange(newRating);
  };

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((index) => (
        <TouchableOpacity
          key={index}
          onPress={() => handlePress(index)}
          activeOpacity={0.7}
          style={styles.star}
        >
          <Star
            size={size}
            fill={index <= rating ? COLORS.warning : 'transparent'}
            color={COLORS.warning}
            strokeWidth={index <= rating ? 0 : 2}
            opacity={index <= rating ? 1 : 0.4}
            pointerEvents="none"
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  star: {
    padding: 4,
  },
});
