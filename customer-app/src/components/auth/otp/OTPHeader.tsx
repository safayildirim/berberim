import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';
import { useTranslation } from 'react-i18next';

interface OTPHeaderProps {
  phone: string;
}

export const OTPHeader: React.FC<OTPHeaderProps> = ({ phone }) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Typography
        variant="caption"
        style={[styles.label, { color: isDark ? '#71717a' : '#a1a1aa' }]}
      >
        {t('auth.verifyCode').toUpperCase()}
      </Typography>
      <Typography
        variant="h1"
        style={[styles.title, { color: isDark ? '#ffffff' : '#18181b' }]}
      >
        {t('auth.checkPhone')}
      </Typography>
      <Typography
        style={[styles.subtitle, { color: isDark ? '#a1a1aa' : '#71717a' }]}
      >
        {t('auth.otpSentTo', { phone })}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    marginTop: 32,
    marginBottom: 40,
  },
  label: {
    fontWeight: '800',
    letterSpacing: 2.5,
    marginBottom: 12,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    maxWidth: 280,
  },
});
