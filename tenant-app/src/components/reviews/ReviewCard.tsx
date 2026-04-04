import { format, parseISO } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { COLORS, SHADOWS, TYPOGRAPHY } from '@/src/constants/theme';
import { Review } from '@/src/hooks/reviews/useReviews';

interface ReviewCardProps {
  review: Review;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language.startsWith('tr') ? tr : enUS;
  const date = parseISO(review.createdAt);

  const formattedDate = format(date, 'MMM dd, yyyy', {
    locale: dateLocale,
  }).toUpperCase();
  const formattedTime = format(
    date,
    i18n.language.startsWith('tr') ? 'HH:mm' : 'hh:mm a',
    { locale: dateLocale },
  );

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.indicator} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.name, review.isAnonymous && styles.anonymous]}>
              {review.isAnonymous
                ? t('reviews.anonymous')
                : review.customerName}
            </Text>
            <Text style={styles.dateTime}>
              {formattedDate} • {formattedTime}
            </Text>
          </View>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={14}
                color={
                  s <= review.rating
                    ? '#fc4f45'
                    : COLORS.surfaceContainerHighest
                }
                fill={s <= review.rating ? '#fc4f45' : 'transparent'}
                strokeWidth={1.5}
              />
            ))}
          </View>
        </View>
        <Text style={styles.comment}>{review.comment}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + '20',
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.sm,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  indicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#10B981',
  },
  content: {
    padding: 20,
    paddingLeft: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  name: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.onSurface,
    fontSize: 15,
  },
  anonymous: {
    fontStyle: 'italic',
    opacity: 0.6,
  },
  dateTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.onSecondaryContainer,
    fontWeight: '600',
    letterSpacing: -0.5,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  comment: {
    ...TYPOGRAPHY.body,
    color: COLORS.onSurfaceVariant,
    lineHeight: 22,
  },
});
