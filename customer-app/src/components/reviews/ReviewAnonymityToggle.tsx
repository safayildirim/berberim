import React from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { COLORS, SIZES } from '@/src/constants/theme';
import { Typography } from '@/src/components/ui';
import { useTranslation } from 'react-i18next';

interface ReviewAnonymityToggleProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
}

export const ReviewAnonymityToggle: React.FC<ReviewAnonymityToggleProps> = ({
  value,
  onValueChange,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.textColumn}>
        <Typography variant="label" style={styles.title}>
          {t('reviews.submit_anonymously', {
            defaultValue: 'Submit anonymously',
          })}
        </Typography>
        <Typography variant="caption" style={styles.subtitle}>
          {t('reviews.anonymous_hint', {
            defaultValue: "Your profile photo and name won't be visible",
          })}
        </Typography>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: COLORS.surfaceContainerHighest,
          true: COLORS.primary,
        }}
        thumbColor={COLORS.white}
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
    backgroundColor: COLORS.surfaceContainerLow + '66', // 30% opacity approx
    borderRadius: 16,
    marginBottom: SIZES.xl,
  },
  textColumn: {
    flex: 1,
    marginRight: SIZES.md,
  },
  title: {
    fontWeight: '800',
    color: COLORS.onSurface,
    marginBottom: 2,
  },
  subtitle: {
    color: COLORS.secondary,
    lineHeight: 16,
  },
});
