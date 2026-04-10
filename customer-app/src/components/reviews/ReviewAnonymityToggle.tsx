import React from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { SIZES } from '@/src/constants/theme';
import { Typography } from '@/src/components/ui';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/src/store/useThemeStore';

interface ReviewAnonymityToggleProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
}

export const ReviewAnonymityToggle: React.FC<ReviewAnonymityToggleProps> = ({
  value,
  onValueChange,
}) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? 'rgba(255,255,255,0.03)'
            : 'rgba(0,0,0,0.02)',
          borderColor: colors.outlineVariant,
        },
      ]}
    >
      <View style={styles.textColumn}>
        <Typography
          variant="label"
          style={[styles.title, { color: colors.onSurface }]}
        >
          {t('reviews.submit_anonymously', {
            defaultValue: 'Submit anonymously',
          })}
        </Typography>
        <Typography
          variant="caption"
          style={[styles.subtitle, { color: colors.secondary }]}
        >
          {t('reviews.anonymous_hint', {
            defaultValue: "Your profile photo and name won't be visible",
          })}
        </Typography>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: isDark ? colors.surfaceContainerHighest : '#e2e8f0',
          true: colors.primary,
        }}
        thumbColor={colors.white}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.md,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: SIZES.xl,
  },
  textColumn: {
    flex: 1,
    marginRight: SIZES.md,
  },
  title: {
    fontWeight: '800',
    marginBottom: 2,
  },
  subtitle: {
    lineHeight: 16,
  },
});
