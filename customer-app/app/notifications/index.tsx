import React from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { format, parseISO } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { Bell, Calendar, CheckCircle2, Info, Tag } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../src/components/common/Screen';
import { Typography } from '../../src/components/ui';
import { COLORS, SIZES } from '../../src/constants/theme';
import { useNotifications } from '../../src/hooks/queries/useCampaigns';
import { useTenantStore } from '../../src/store/useTenantStore';

export default function NotificationsScreen() {
  const { t, i18n } = useTranslation();
  const { getBranding } = useTenantStore();
  const { primaryColor } = getBranding();

  const {
    data: notifications,
    isLoading: isNotificationsLoading,
    error,
  } = useNotifications();

  const dateLocale = i18n.language.startsWith('tr') ? tr : enUS;

  const getIcon = (type: string, isRead: boolean) => {
    switch (type) {
      case 'booking':
        return (
          <Calendar
            size={20}
            color={isRead ? COLORS.secondary : primaryColor}
            pointerEvents="none"
          />
        );
      case 'campaign':
        return (
          <Tag
            size={20}
            color={isRead ? COLORS.secondary : COLORS.warning}
            pointerEvents="none"
          />
        );
      case 'status':
        return (
          <CheckCircle2
            size={20}
            color={isRead ? COLORS.secondary : COLORS.success}
            pointerEvents="none"
          />
        );
      default:
        return <Info size={20} color={COLORS.secondary} pointerEvents="none" />;
    }
  };

  return (
    <Screen
      headerTitle={t('notifications.title')}
      loading={isNotificationsLoading}
      error={error}
    >
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.notificationItem,
              !item.isRead && {
                backgroundColor: primaryColor + '05',
                borderLeftColor: primaryColor,
                borderLeftWidth: 4,
              },
            ]}
            onPress={() => {}}
          >
            <View style={styles.iconContainer}>
              {getIcon(item.type, item.isRead)}
            </View>
            <View style={styles.content}>
              <View style={styles.headerRow}>
                <Typography
                  variant="label"
                  style={{ fontWeight: item.isRead ? '600' : '800' }}
                >
                  {item.title}
                </Typography>
                <Typography variant="caption" color={COLORS.secondary}>
                  {format(parseISO(item.createdAt), 'MMM d', {
                    locale: dateLocale,
                  })}
                </Typography>
              </View>
              <Typography
                variant="body"
                color={COLORS.secondary}
                numberOfLines={2}
                style={styles.body}
              >
                {item.body}
              </Typography>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Bell size={64} color={COLORS.border} />
            <Typography variant="h3" style={{ marginTop: SIZES.md }}>
              {t('notifications.noNotifications')}
            </Typography>
            <Typography
              variant="body"
              color={COLORS.secondary}
              align="center"
              style={{ marginTop: SIZES.sm }}
            >
              {t('notifications.noNotificationsDesc')}
            </Typography>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: SIZES.padding * 2,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.muted,
    marginRight: SIZES.md,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    paddingVertical: SIZES.padding * 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
