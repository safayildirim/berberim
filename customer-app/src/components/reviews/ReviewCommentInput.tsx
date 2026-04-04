import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { COLORS, SIZES, TYPOGRAPHY } from '@/src/constants/theme';
import { Typography } from '@/src/components/ui';
import { useTranslation } from 'react-i18next';

interface ReviewCommentInputProps {
  value: string;
  onChange: (text: string) => void;
}

export const ReviewCommentInput: React.FC<ReviewCommentInputProps> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Typography variant="label" style={styles.label}>
        {t('reviews.experience_details', {
          defaultValue: 'Experience Details',
        })}
      </Typography>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={t('reviews.comment_placeholder', {
          defaultValue: 'Share your experience...',
        })}
        placeholderTextColor={COLORS.onSurfaceVariant}
        multiline
        numberOfLines={5}
        maxLength={500}
        style={styles.textArea}
        textAlignVertical="top"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.lg,
    gap: 12,
  },
  label: {
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  textArea: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: SIZES.md,
    ...TYPOGRAPHY.body,
    height: 160,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
  },
});
