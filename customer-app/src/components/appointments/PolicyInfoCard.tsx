import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react-native';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';

export const PolicyInfoCard = () => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(39, 39, 42, 0.5)' : '#f9fafb',
          borderColor: isDark ? 'rgba(63, 63, 70, 0.5)' : '#f3f4f6',
        },
      ]}
    >
      <AlertCircle
        size={20}
        color={isDark ? '#a1a1aa' : '#71717a'}
        style={styles.icon}
      />
      <View style={styles.content}>
        <Typography variant="body" style={styles.text}>
          <Typography
            variant="body"
            style={[styles.bold, { color: isDark ? '#e4e4e7' : '#18181b' }]}
          >
            {t('common.cancellationPolicyLabel')}:{' '}
          </Typography>
          <Typography
            variant="body"
            style={{ color: isDark ? '#a1a1aa' : '#52525b' }}
          >
            {t('booking.cancellationPolicy')}
          </Typography>
        </Typography>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    marginBottom: 24,
  },
  icon: {
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  text: {
    fontSize: 13,
    lineHeight: 18,
  },
  bold: {
    fontWeight: '800',
  },
});
