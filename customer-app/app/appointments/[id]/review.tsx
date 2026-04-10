import { useLocalSearchParams, useRouter } from 'expo-router';
import { Send } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/src/components/common/Screen';
import { ReviewAnonymityToggle } from '@/src/components/reviews/ReviewAnonymityToggle';
import { ReviewCommentInput } from '@/src/components/reviews/ReviewCommentInput';
import { ReviewHeader } from '@/src/components/reviews/ReviewHeader';
import { ReviewRatingSelector } from '@/src/components/reviews/ReviewRatingSelector';
import { Button } from '@/src/components/ui';
import { SHADOWS, SIZES } from '@/src/constants/theme';
import {
  useCreateReview,
  useUpdateReview,
} from '@/src/hooks/mutations/useReviewMutations';
import { useAppointmentDetail } from '@/src/hooks/queries/useAppointments';
import { useMyReview } from '@/src/hooks/queries/useReviews';
import { useTheme } from '@/src/store/useThemeStore';

export default function AddReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const { data: appointment, isLoading: isLoadingAppointment } =
    useAppointmentDetail(id as string);

  const { data: review, isLoading: isLoadingReview } = useMyReview(
    id as string,
  );

  const { mutateAsync: createReview, isPending: isCreating } =
    useCreateReview();
  const { mutateAsync: updateReview, isPending: isUpdating } =
    useUpdateReview();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Initialize form state when review data is loaded
  React.useEffect(() => {
    if (review) {
      setRating(review.rating);
      setComment(review.comment || '');
      setIsAnonymous(review.is_anonymous || false);
    }
  }, [review]);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert(t('common.error'), t('reviews.rating_required'));
      return;
    }

    const reviewData = {
      rating,
      comment,
      is_anonymous: isAnonymous,
    };

    try {
      if (review) {
        await updateReview({ id: review.id, data: reviewData });
        Alert.alert(t('common.done'), t('reviews.update_success'));
      } else {
        await createReview({
          appointment_id: id as string,
          ...reviewData,
        });
        Alert.alert(t('common.done'), t('reviews.create_success'));
      }
      router.back();
    } catch {
      // Error is handled by mutation
    }
  };

  const isLoading = isLoadingAppointment || isLoadingReview;
  const isSubmitting = isCreating || isUpdating;

  return (
    <Screen
      headerTitle={
        appointment?.staff
          ? `${appointment.staff.first_name} ${appointment.staff.last_name}`
          : t('reviews.rate_experience')
      }
      showHeaderBack={true}
      loading={isLoading}
      style={styles.screen}
      transparentStatusBar
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <ReviewHeader
            staffName={appointment?.staff?.first_name}
            staffImageUrl={appointment?.staff?.avatar}
          />

          <ReviewRatingSelector rating={rating} onRatingChange={setRating} />

          <ReviewCommentInput value={comment} onChange={setComment} />

          <ReviewAnonymityToggle
            value={isAnonymous}
            onValueChange={setIsAnonymous}
          />
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.outlineVariant,
              paddingBottom: Math.max(insets.bottom, SIZES.md),
            },
          ]}
        >
          <Button
            title={review ? t('common.save') : t('common.submit')}
            icon={<Send size={20} color={colors.onPrimary} />}
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={rating === 0 || isSubmitting}
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            titleStyle={{ color: colors.onPrimary }}
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.lg,
    paddingTop: SIZES.xl,
    paddingBottom: SIZES.xl,
  },
  footer: {
    padding: SIZES.lg,
    borderTopWidth: 1,
  },
  submitButton: {
    height: 64,
    borderRadius: 20,
    ...SHADOWS.md,
  },
});
