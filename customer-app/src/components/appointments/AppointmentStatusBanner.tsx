import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Clock } from 'lucide-react-native';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';

interface AppointmentStatusBannerProps {
  status: string;
}

export const AppointmentStatusBanner = ({
  status,
}: AppointmentStatusBannerProps) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const isConfirmed =
    status === 'confirmed' ||
    status === 'payment_received' ||
    status === 'completed';

  if (!isConfirmed) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : '#dcfce7',
          borderColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#bbf7d0',
        },
      ]}
    >
      <CheckCircle2
        size={24}
        color={isDark ? '#22c55e' : '#16a34a'}
        style={styles.icon}
      />
      <View>
        <Typography
          variant="h3"
          style={[styles.title, { color: isDark ? '#4ade80' : '#166534' }]}
        >
          {t('appointments.status.confirmed')}
        </Typography>
        <Typography
          variant="caption"
          style={[styles.subtitle, { color: isDark ? '#22c55e80' : '#15803d' }]}
        >
          {t('appointments.statusBannerSubtitle')}
        </Typography>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: 24,
  },
  icon: {
    flexShrink: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
});
