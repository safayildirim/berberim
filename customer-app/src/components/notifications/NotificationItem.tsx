import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { CalendarClock, Award, Info, Bell } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';
import { AppNotification } from '@/src/types';

interface NotificationItemProps {
  notification: AppNotification;
  onPress?: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
}) => {
  const { colors, isDark } = useTheme();
  const { i18n } = useTranslation();
  const dateLocale = i18n.language.startsWith('tr') ? tr : enUS;

  const getIconConfig = (type: string) => {
    switch (type) {
      case 'booking':
        return {
          icon: CalendarClock,
          color: '#3b82f6',
          bg: isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff',
        };
      case 'campaign':
        return {
          icon: Award,
          color: '#f59e0b',
          bg: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb',
        };
      case 'status':
        return {
          icon: Info,
          color: '#10b981',
          bg: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ecfdf5',
        };
      default:
        return {
          icon: Bell,
          color: colors.secondary,
          bg: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f4f4f5',
        };
    }
  };

  const config = getIconConfig(notification.type);
  const Icon = config.icon;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: notification.is_read
            ? colors.background
            : colors.surfaceContainerLowest,
          borderColor: notification.is_read
            ? colors.outlineVariant
            : '#f59e0b20',
        },
        !notification.is_read && styles.unreadShadow,
      ]}
    >
      {!notification.is_read && (
        <View
          style={[styles.unreadIndicator, { backgroundColor: '#f59e0b' }]}
        />
      )}
      <View style={styles.contentRow}>
        <View style={[styles.iconWrapper, { backgroundColor: config.bg }]}>
          <Icon size={20} color={config.color} strokeWidth={2} />
        </View>
        <View style={styles.文本Content}>
          <View style={styles.headerRow}>
            <Typography
              variant="label"
              style={[
                styles.title,
                {
                  color: notification.is_read ? colors.secondary : colors.text,
                },
              ]}
              numberOfLines={1}
            >
              {notification.title}
            </Typography>
            <Typography
              variant="caption"
              style={{ color: colors.onSurfaceVariant }}
            >
              {format(parseISO(notification.created_at), 'MMM d', {
                locale: dateLocale,
              })}
            </Typography>
          </View>
          <Typography
            variant="body"
            style={[
              styles.body,
              {
                color: notification.is_read
                  ? colors.onSurfaceVariant
                  : colors.secondary,
              },
            ]}
            numberOfLines={2}
          >
            {notification.body}
          </Typography>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  unreadShadow: {
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    gap: 16,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  文本Content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    marginRight: 8,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
  },
});
