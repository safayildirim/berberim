import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY } from '@/src/constants/theme';
import { useTranslation } from 'react-i18next';

export const EmptyReviewsState: React.FC = () => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Star size={40} color={COLORS.outlineVariant} strokeWidth={1.5} />
      </View>
      <Text style={styles.title}>
        {t('reviews.emptyTitle', 'No reviews yet')}
      </Text>
      <Text style={styles.description}>
        {t(
          'reviews.emptyDescription',
          'Once customers start leaving feedback, they will appear here in chronological order.',
        )}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 120,
    alignItems: 'center',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.onSurface,
    fontWeight: '800',
    fontSize: 22,
    marginBottom: 8,
  },
  description: {
    ...TYPOGRAPHY.body,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
});
