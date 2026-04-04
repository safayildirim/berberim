import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { StaffReview } from '@/src/types';
import { COLORS, SIZES } from '@/src/constants/theme';
import { Typography } from '@/src/components/ui';
import { StarRatingDisplay } from './StarRatingDisplay';
import { Pencil, Trash2, User } from 'lucide-react-native';
import { format } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';

interface ReviewCardProps {
  review: StaffReview;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const locale = i18n.language === 'tr' ? tr : enUS;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <StarRatingDisplay rating={review.rating} showCount={false} size={20} />
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
              <Pencil size={18} color={COLORS.secondary} pointerEvents="none" />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
              <Trash2 size={18} color={COLORS.error} pointerEvents="none" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {review.comment ? (
        <Typography variant="body" style={styles.comment}>
          {review.comment}
        </Typography>
      ) : null}

      <View style={styles.footer}>
        <View style={styles.userInfo}>
          {review.is_anonymous ? (
            <View style={styles.anonymousBadge}>
              <User size={12} color={COLORS.secondary} />
              <Typography
                variant="caption"
                color={COLORS.secondary}
                style={{ marginLeft: 4 }}
              >
                {t('reviews.anonymous')}
              </Typography>
            </View>
          ) : (
            <Typography variant="caption" color={COLORS.secondary}>
              {t('reviews.your_review')}
            </Typography>
          )}
        </View>
        <Typography variant="caption" color={COLORS.secondary}>
          {format(new Date(review.created_at), 'd MMMM yyyy', { locale })}
        </Typography>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHigh,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
  comment: {
    color: COLORS.text,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  anonymousBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
