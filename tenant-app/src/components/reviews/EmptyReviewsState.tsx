import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { TYPOGRAPHY } from '@/src/constants/theme';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/src/hooks/useTheme';

export const EmptyReviewsState: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: colors.surfaceContainerLow },
        ]}
      >
        <Star size={40} color={colors.primary + '30'} strokeWidth={1.5} />
      </View>
      <Text style={[styles.title, { color: colors.primary }]}>
        {t('reviews.emptyTitle', 'No reviews yet')}
      </Text>
      <Text style={[styles.description, { color: colors.secondary }]}>
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
    paddingVertical: 100,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    ...TYPOGRAPHY.h2,
    fontSize: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.8,
  },
});
