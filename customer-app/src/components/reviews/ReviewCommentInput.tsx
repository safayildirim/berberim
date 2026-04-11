import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { SIZES, TYPOGRAPHY } from '@/src/constants/theme';
import { Typography } from '@/src/components/ui';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/src/store/useThemeStore';

interface ReviewCommentInputProps {
  value: string;
  onChange: (text: string) => void;
}

export const ReviewCommentInput: React.FC<ReviewCommentInputProps> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Typography
        variant="label"
        style={[styles.label, { color: colors.onSurface }]}
      >
        {t('reviews.comment_optional')}
      </Typography>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={t('reviews.comment_placeholder', {
          defaultValue: 'Share your experience...',
        })}
        placeholderTextColor={colors.onSurfaceVariant}
        multiline
        numberOfLines={5}
        maxLength={500}
        style={[
          styles.textArea,
          {
            backgroundColor: colors.surfaceContainerLow,
            borderColor: colors.outlineVariant,
            color: colors.text,
          },
        ]}
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
  },
  textArea: {
    borderRadius: 16,
    padding: SIZES.md,
    ...TYPOGRAPHY.body,
    height: 160,
    borderWidth: 1,
  },
});
