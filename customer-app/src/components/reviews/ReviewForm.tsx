import React from 'react';
import { View, TextInput, StyleSheet, Switch } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { StarRatingInput } from './StarRatingInput';
import { COLORS, SIZES, TYPOGRAPHY } from '@/src/constants/theme';
import { Typography, Button } from '@/src/components/ui';
import { useTranslation } from 'react-i18next';

const schema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(500).optional(),
  is_anonymous: z.boolean(),
});

export type ReviewFormData = z.infer<typeof schema>;

interface ReviewFormProps {
  initialValues?: Partial<ReviewFormData>;
  onSubmit: (data: ReviewFormData) => void;
  isLoading?: boolean;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  initialValues,
  onSubmit,
  isLoading,
}) => {
  const { t } = useTranslation();
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      rating: initialValues?.rating || 0,
      comment: initialValues?.comment || '',
      is_anonymous: initialValues?.is_anonymous || false,
    },
  });

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="rating"
        render={({ field: { value, onChange } }) => (
          <View style={styles.section}>
            <StarRatingInput rating={value} onRatingChange={onChange} />
            {errors.rating && (
              <Typography
                align="center"
                variant="caption"
                color={COLORS.error}
                style={styles.error}
              >
                {t('reviews.rating_required')}
              </Typography>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="comment"
        render={({ field: { value, onChange } }) => (
          <View style={styles.section}>
            <Typography variant="label" style={styles.label}>
              {t('reviews.comment_optional')}
            </Typography>
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder={t('reviews.comment_placeholder')}
              placeholderTextColor={COLORS.onSurfaceVariant}
              multiline
              numberOfLines={4}
              maxLength={500}
              style={styles.textArea}
            />
          </View>
        )}
      />

      <Controller
        control={control}
        name="is_anonymous"
        render={({ field: { value, onChange } }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Typography variant="label">
                {t('reviews.anonymous_review')}
              </Typography>
              <Typography variant="caption" color={COLORS.secondary}>
                {t('reviews.anonymous_hint')}
              </Typography>
            </View>
            <Switch
              value={value}
              onValueChange={onChange}
              trackColor={{
                false: COLORS.surfaceContainerHigh,
                true: COLORS.primary,
              }}
              thumbColor={COLORS.white}
            />
          </View>
        )}
      />

      <Button
        title={t('common.submit')}
        onPress={handleSubmit(onSubmit)}
        disabled={isLoading || !isValid}
        loading={isLoading}
        style={styles.submitButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    gap: 20,
  },
  section: {
    gap: 8,
  },
  label: {
    fontWeight: '700',
    color: COLORS.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
  },
  textArea: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 12,
    padding: 16,
    ...TYPOGRAPHY.body,
    height: 120,
    textAlignVertical: 'top',
    color: COLORS.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainerLow,
    padding: 12,
    borderRadius: 12,
  },
  submitButton: {
    marginTop: 8,
  },
  error: {
    marginTop: 4,
  },
});
