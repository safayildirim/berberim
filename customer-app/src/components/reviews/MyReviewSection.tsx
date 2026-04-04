import { Pencil, Star, Trash2 } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { COLORS, SHADOWS, SIZES } from '@/src/constants/theme';
import { StaffReview } from '@/src/types';
import { DateTime, Typography } from '@/src/components/ui';

interface MyReviewSectionProps {
  review: StaffReview;
  onEdit: () => void;
  onDelete: () => void;
}

export const MyReviewSection: React.FC<MyReviewSectionProps> = ({
  review,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((index) => (
          <Star
            key={index}
            size={14}
            fill={index <= rating ? '#C5A059' : 'transparent'}
            color={index <= rating ? '#C5A059' : COLORS.outlineVariant}
            strokeWidth={index <= rating ? 0 : 2}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h3" style={styles.title}>
          {t('reviews.your_review')}
        </Typography>
        {review.is_anonymous && (
          <View style={styles.anonBadge}>
            <Typography variant="caption" style={styles.anonLabel}>
              {t('reviews.anonymous').toUpperCase()}
            </Typography>
          </View>
        )}
      </View>

      <View style={styles.contentCard}>
        <View style={styles.cardTopRow}>
          {renderStars(review.rating)}
          <DateTime
            date={review.created_at}
            formatString="MMM dd, yyyy"
            variant="caption"
            style={styles.dateText}
          />
        </View>

        {review.comment && (
          <Typography variant="body" style={styles.comment}>
            &quot;{review.comment}&quot;
          </Typography>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={onEdit}
            style={styles.actionBtn}
            activeOpacity={0.7}
          >
            <Pencil size={12} color="#C5A059" pointerEvents="none" />
            <Typography variant="caption" style={styles.editBtnText}>
              {t('common.edit').toUpperCase()}
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onDelete}
            style={styles.actionBtn}
            activeOpacity={0.7}
          >
            <Trash2 size={12} color={COLORS.error} pointerEvents="none" />
            <Typography variant="caption" style={styles.deleteBtnText}>
              {t('common.delete').toUpperCase()}
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    marginBottom: SIZES.lg,
    ...SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  anonBadge: {
    backgroundColor: COLORS.surfaceContainerHighest,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 100,
  },
  anonLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  contentCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHigh,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
  },
  dateText: {
    color: COLORS.onSecondaryContainer,
    fontSize: 11,
  },
  comment: {
    fontStyle: 'italic',
    fontWeight: '500',
    color: COLORS.onSurface,
    lineHeight: 20,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(235, 231, 230, 0.5)', // From surface-container-high
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editBtnText: {
    color: '#C5A059',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  deleteBtnText: {
    color: COLORS.error,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
