import { Scissors, Star } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SHADOWS } from '@/src/constants/theme';
import { useCreateReview } from '@/src/hooks/mutations/useReviewMutations';
import { Button, Typography } from '@/src/components/ui';

interface AddReviewCardProps {
  appointmentId: string;
  staffName: string;
  onSuccess?: () => void;
}

const GOLD = '#C5A059';

export const AddReviewCard: React.FC<AddReviewCardProps> = ({
  appointmentId,
  staffName,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const { mutate: createReview, isPending } = useCreateReview();

  const handleSubmit = () => {
    if (rating === 0) return;

    createReview(
      {
        appointment_id: appointmentId,
        rating,
        comment,
        is_anonymous: false,
      },
      {
        onSuccess: () => {
          onSuccess?.();
        },
      },
    );
  };

  return (
    <View style={styles.card}>
      {/* Decorative Background Icon */}
      <View style={styles.decorationContainer}>
        <Scissors size={120} color="rgba(255,255,255,0.05)" strokeWidth={1} />
      </View>

      <View style={styles.content}>
        <Typography variant="h3" style={styles.title}>
          {t('reviews.rate_experience')}
        </Typography>
        <Typography variant="caption" style={styles.subtitle}>
          {t('reviews.rate_subtitle', { name: staffName })}
        </Typography>

        {/* Star Input */}
        <View style={styles.starContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              activeOpacity={0.7}
              onPress={() => setRating(star)}
              style={styles.starButton}
            >
              <Star
                size={34}
                color={star <= rating ? GOLD : '#444'}
                fill={star <= rating ? GOLD : 'transparent'}
                strokeWidth={1.5}
                pointerEvents="none"
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.form}>
          <TextInput
            multiline
            numberOfLines={3}
            placeholder={t('reviews.private_note_placeholder')}
            placeholderTextColor="#666"
            value={comment}
            onChangeText={setComment}
            style={styles.input}
          />

          <Button
            title={t('common.submit')}
            onPress={handleSubmit}
            disabled={rating === 0 || isPending}
            loading={isPending}
            style={[styles.submitButton, { backgroundColor: GOLD }]}
            titleStyle={styles.submitButtonText}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 32,
    padding: 32,
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.lg,
  },
  decorationContainer: {
    position: 'absolute',
    top: -20,
    right: -20,
    zIndex: 0,
  },
  content: {
    zIndex: 1,
  },
  title: {
    color: '#F8F8F7',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    color: '#999',
    lineHeight: 20,
    marginBottom: 32,
  },
  starContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  starButton: {
    padding: 2,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#222',
    borderRadius: 16,
    padding: 16,
    color: '#F8F8F7',
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#333',
  },
  submitButton: {
    height: 64,
    borderRadius: 20,
    borderWidth: 0,
  },
  submitButtonText: {
    color: '#1A1A1A',
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontSize: 14,
  },
});
