import { format, parseISO } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { SHADOWS, TYPOGRAPHY } from '@/src/constants/theme';
import { Review } from '@/src/hooks/reviews/useReviews';
import { useTheme } from '@/src/hooks/useTheme';

interface ReviewCardProps {
  review: Review;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
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
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.surfaceContainerLowest,
          borderColor: colors.border + '15',
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.indicator, { backgroundColor: colors.success }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text
              style={[
                styles.name,
                { color: colors.primary },
                review.isAnonymous && styles.anonymous,
              ]}
              numberOfLines={1}
            >
              {review.isAnonymous
                ? t('reviews.anonymous')
                : review.customerName}
            </Text>
            <Text style={[styles.dateTime, { color: colors.secondary }]}>
              {formattedDate} • {formattedTime}
            </Text>
          </View>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={12}
                color={
                  s <= review.rating ? colors.primary : colors.outline + '40'
                }
                fill={s <= review.rating ? colors.primary : 'transparent'}
                strokeWidth={2}
              />
            ))}
          </View>
        </View>
        <Text style={[styles.comment, { color: colors.primary }]}>
          {review.comment}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.sm,
  },
  pressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.9,
  },
  indicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerInfo: {
    flex: 1,
    marginRight: 10,
  },
  name: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 16,
  },
  anonymous: {
    fontStyle: 'italic',
    opacity: 0.7,
  },
  dateTime: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  stars: {
    flexDirection: 'row',
    gap: 1.5,
    marginTop: 2,
  },
  comment: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    lineHeight: 22,
  },
});
