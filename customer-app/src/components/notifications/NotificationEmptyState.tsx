import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';
import { SIZES } from '@/src/constants/theme';

export const NotificationEmptyState = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconWrapper,
          { backgroundColor: colors.surfaceContainer },
        ]}
      >
        <Bell
          size={48}
          color={colors.secondary}
          strokeWidth={1.5}
          style={{ opacity: 0.2 }}
        />
      </View>
      <Typography variant="h3" style={{ color: colors.text, marginBottom: 8 }}>
        {t('notifications.noNotifications')}
      </Typography>
      <Typography
        variant="body"
        style={{ color: colors.secondary, textAlign: 'center' }}
      >
        {t('notifications.noNotificationsDesc')}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.lg,
  },
});
