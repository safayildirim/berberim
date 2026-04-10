import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen } from '@/src/components/common/Screen';
import { ReviewsSummaryCard } from '@/src/components/reviews/ReviewsSummaryCard';
import { ReviewsFilterSection } from '@/src/components/reviews/ReviewsFilterSection';
import { ReviewListSection } from '@/src/components/reviews/ReviewListSection';
import { EmptyReviewsState } from '@/src/components/reviews/EmptyReviewsState';
import { useReviews } from '@/src/hooks/reviews/useReviews';
import { COLORS } from '@/src/constants/theme';
import { useTranslation } from 'react-i18next';
import { useTenantStore } from '@/src/store/useTenantStore';

export default function ReviewsScreen() {
  const { reviews, isLoading, filter, setFilter, stats } = useReviews();
  const { t } = useTranslation();

  const { getBranding } = useTenantStore();
  const branding = getBranding();

  return (
    <Screen
      scrollable
      backgroundColor={COLORS.background}
      withPadding={false}
      headerTitle={branding.name}
      headerSubtitle={t('nav.reviews')}
    >
      <View style={styles.scrollContent}>
        <View style={styles.topContent}>
          <ReviewsSummaryCard
            averageRating={stats.averageRating}
            totalCount={stats.totalCount}
          />
        </View>

        <ReviewsFilterSection
          currentFilter={filter}
          onFilterChange={setFilter}
        />

        {reviews.length > 0 ? (
          <ReviewListSection reviews={reviews} isLoading={isLoading} />
        ) : (
          <EmptyReviewsState />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 120, // Space for tab bar
    paddingTop: 8,
  },
  topContent: {
    paddingHorizontal: 24,
  },
});
