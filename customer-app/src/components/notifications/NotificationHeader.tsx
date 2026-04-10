import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { CheckCheck, ArrowLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';

interface NotificationHeaderProps {
  unreadCount: number;
  onMarkAllRead: () => void;
}

export const NotificationHeader: React.FC<NotificationHeaderProps> = ({
  unreadCount,
  onMarkAllRead,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[
            styles.backButton,
            { backgroundColor: isDark ? colors.surfaceContainer : '#f4f4f5' },
          ]}
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.titleRow}>
          <Typography variant="h2" style={{ color: colors.text }}>
            {t('notifications.title')}
          </Typography>
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: '#f59e0b' }]}>
              <Typography variant="caption" style={styles.badgeText}>
                {unreadCount}
              </Typography>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity
        onPress={onMarkAllRead}
        disabled={unreadCount === 0}
        style={[styles.actionButton, unreadCount === 0 && { opacity: 0.3 }]}
      >
        <CheckCheck
          size={20}
          color={unreadCount > 0 ? '#f59e0b' : colors.secondary}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
  },
  actionButton: {
    padding: 8,
    marginRight: -8,
  },
});
