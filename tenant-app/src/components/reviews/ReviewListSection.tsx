import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { ReviewCard } from './ReviewCard';
import { Review } from '@/src/hooks/reviews/useReviews';
import { COLORS, TYPOGRAPHY } from '@/src/constants/theme';
import { useTranslation } from 'react-i18next';

interface ReviewListProps {
  reviews: Review[];
  isLoading: boolean;
}

export const ReviewListSection: React.FC<ReviewListProps> = ({
  reviews,
  isLoading,
}) => {
  const { t } = useTranslation();

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.footer}>
        <View style={styles.loadingContainer}>
          <View style={styles.pulseDot} />
          <Text style={styles.footerText}>
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
        scrollEnabled={false} // Container usually scrolls
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
  },
  listContent: {
    gap: 16,
    paddingBottom: 32,
  },
  footer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.onSecondaryContainer,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});
