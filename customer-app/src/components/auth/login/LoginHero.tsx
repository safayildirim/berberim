import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';
import { useTranslation } from 'react-i18next';
import { useTenantStore } from '@/src/store/useTenantStore';

export const LoginHero = () => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { config } = useTenantStore();

  return (
    <View style={styles.container}>
      <Typography
        variant="caption"
        style={[styles.welcomeLabel, { color: isDark ? '#71717a' : '#a1a1aa' }]}
      >
        {t('auth.welcome').toUpperCase()}
      </Typography>
      <Typography
        variant="h1"
        style={[styles.title, { color: isDark ? '#ffffff' : '#18181b' }]}
      >
        {config?.name || 'Berberim'}
      </Typography>
      <Typography
        style={[styles.subtitle, { color: isDark ? '#a1a1aa' : '#71717a' }]}
      >
        {t('auth.phoneNumberSubtitle')}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    marginTop: 32,
    marginBottom: 48,
  },
  welcomeLabel: {
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
