import { useMemo, useState } from 'react';
import { useSessionStore } from '@/src/store/useSessionStore';
import { useStaffReviews } from '../queries/useStaff';

export interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  isAnonymous?: boolean;
  createdAt: string; // ISO string
}

export type ReviewFilter = 'all' | '5' | '4' | 'recent';

export const useReviews = () => {
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const { user } = useSessionStore();

  const { data, isLoading } = useStaffReviews(user?.id ?? '');

  const allReviews: Review[] = useMemo(() => {
    if (!data?.reviews) return [];
    return data.reviews.map((r) => {
      return {
        id: r.id,
        customerName: r.is_anonymous ? '' : (r.customer_name ?? ''),
        rating: r.rating,
        comment: r.comment ?? '',
        isAnonymous: r.is_anonymous,
        createdAt: r.created_at,
      };
    });
  }, [data]);

  const reviews = useMemo(() => {
    switch (filter) {
      case '5':
        return allReviews.filter((r) => r.rating === 5);
      case '4':
        return allReviews.filter((r) => r.rating === 4);
      case 'recent':
        return [...allReviews].sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt),
        );
      default:
        return allReviews;
    }
  }, [filter, allReviews]);

  const averageRating = useMemo(() => {
    if (!allReviews.length) return 0;
    const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / allReviews.length) * 10) / 10;
  }, [allReviews]);

  return {
    reviews,
    isLoading,
    filter,
    setFilter,
    stats: {
      averageRating,
      totalCount: data?.total ?? 0,
    },
  };
};
