import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { ReviewCard } from './ReviewCard';
import { Review } from '@/src/hooks/reviews/useReviews';
import { TYPOGRAPHY } from '@/src/constants/theme';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/src/hooks/useTheme';

interface ReviewListProps {
  reviews: Review[];
  isLoading: boolean;
}

export const ReviewListSection: React.FC<ReviewListProps> = ({
  reviews,
  isLoading,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.footer}>
        <View style={styles.loadingContainer}>
          <View
            style={[styles.pulseDot, { backgroundColor: colors.primary }]}
          />
          <Text style={[styles.footerText, { color: colors.secondary }]}>
            {t('reviews.loadingMore', 'Loading more reviews')}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ReviewCard review={item} />}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={renderFooter}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Padding handled by cards
  },
  listContent: {
    paddingBottom: 32,
  },
  footer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  footerText: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});
