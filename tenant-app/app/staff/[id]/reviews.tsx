import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Text,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Star, User } from 'lucide-react-native';
import { format } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

import { Header } from '@/src/components/common/Header';
import { Screen } from '@/src/components/common/Screen';
import { COLORS, SIZES, TYPOGRAPHY } from '@/src/constants/theme';
import { useStaffDetail, useStaffReviews } from '@/src/hooks/queries/useStaff';
import { StaffReview } from '@/src/types';

const ReviewCard = ({ review }: { review: StaffReview }) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'tr' ? tr : enUS;

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={14}
              fill={star <= review.rating ? COLORS.warning : 'transparent'}
              color={COLORS.warning}
              strokeWidth={star <= review.rating ? 0 : 2}
              opacity={star <= review.rating ? 1 : 0.3}
            />
          ))}
        </View>
        <Text style={styles.dateText}>
          {format(new Date(review.created_at), 'd MMM yyyy', { locale })}
        </Text>
      </View>

      {review.comment ? (
        <Text style={styles.comment}>{review.comment}</Text>
      ) : null}

      <View style={styles.reviewFooter}>
        {review.is_anonymous || !review.customer_id ? (
          <View style={styles.customerInfo}>
            <User size={12} color={COLORS.muted} />
            <Text style={styles.anonymousText}>{t('reviews.anonymous')}</Text>
          </View>
        ) : (
          <Text style={styles.customerName}>
            {t('reviews.customer_review')}
          </Text>
        )}
      </View>
    </View>
  );
};

export default function StaffReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  const { data: staff } = useStaffDetail(id as string);
  const { data, isLoading, isFetching, refetch } = useStaffReviews(
    id as string,
    page,
  );

  const reviews = data?.reviews || [];

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryItem}>
          <Text style={styles.avgRating}>
            {staff?.avg_rating?.toFixed(1) || '0.0'}
          </Text>
          <View style={[styles.starRow, { marginBottom: 8 }]}>
            <Star
              size={24}
              fill={COLORS.warning}
              color={COLORS.warning}
              strokeWidth={0}
            />
          </View>
          <Text style={styles.totalReviews}>
            {staff?.review_count || 0} {t('reviews.total_reviews')}
          </Text>
        </View>
      </View>
      <Text style={styles.sectionTitle}>{t('reviews.recent_reviews')}</Text>
    </View>
  );

  return (
    <Screen style={styles.container} withPadding={false}>
      <Header title={t('reviews.staff_reviews')} showBack />
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ReviewCard review={item} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('reviews.no_reviews')}</Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && page === 1}
            onRefresh={() => {
              setPage(1);
              refetch();
            }}
          />
        }
        onEndReached={() => {
          if (data && page < data.total_pages) {
            setPage(page + 1);
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetching && page > 1 ? (
            <ActivityIndicator style={{ margin: SIZES.md }} />
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SIZES.md,
  },
  headerContainer: {},
  summaryGrid: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 24,
  },
  summaryItem: {
    alignItems: 'center',
    gap: 4,
  },
  avgRating: {
    fontSize: 56,
    lineHeight: 64,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -2,
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
  },
  totalReviews: {
    ...TYPOGRAPHY.label,
    color: COLORS.secondary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    fontWeight: '800',
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: SIZES.md,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.muted,
    fontWeight: '600',
  },
  comment: {
    ...TYPOGRAPHY.body,
    lineHeight: 22,
    color: COLORS.onSurface,
  },
  reviewFooter: {
    marginTop: 4,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  anonymousText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.muted,
    marginLeft: 4,
    fontWeight: '600',
  },
  customerName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.secondary,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: SIZES.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.muted,
  },
});
