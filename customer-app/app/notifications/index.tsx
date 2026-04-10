import React, { useMemo } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { Screen } from '@/src/components/common/Screen';
import { useNotifications } from '@/src/hooks/queries/useCampaigns';
import { useNotificationMutations } from '@/src/hooks/mutations/useNotificationMutations';
import { NotificationItem } from '@/src/components/notifications/NotificationItem';
import { NotificationEmptyState } from '@/src/components/notifications/NotificationEmptyState';
import { NotificationHeader } from '@/src/components/notifications/NotificationHeader';
import { useTheme } from '@/src/store/useThemeStore';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { data: notifications = [], isLoading, error } = useNotifications();
  const { markAllAsRead, markAsRead } = useNotificationMutations();

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications],
  );

  const handleMarkAllRead = () => {
    markAllAsRead.mutate();
  };

  const handleNotificationPress = (id: string, isRead: boolean) => {
    if (!isRead) {
      markAsRead.mutate(id);
    }
  };

  return (
    <Screen
      headerTitle={undefined} // We use custom header inside
      loading={isLoading}
      error={error}
      style={{ backgroundColor: colors.background }}
    >
      <NotificationHeader
        unreadCount={unreadCount}
        onMarkAllRead={handleMarkAllRead}
      />

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={() => handleNotificationPress(item.id, item.is_read)}
          />
        )}
        ListEmptyComponent={<NotificationEmptyState />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
});
