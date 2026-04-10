import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { MapPin, Bell } from 'lucide-react-native';
import { useTheme } from '@/src/store/useThemeStore';
import { Typography } from '@/src/components/ui';
import { SIZES } from '@/src/constants/theme';

interface HomeHeaderProps {
  user: {
    name: string;
    avatar: string;
  } | null;
  location: string;
}

export const HomeHeader = ({ user, location }: HomeHeaderProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={[styles.header, { backgroundColor: colors.background }]}>
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: user?.avatar }} style={styles.avatar} />
          <View
            style={[styles.statusIndicator, { borderColor: colors.background }]}
          />
        </View>
        <View>
          <Typography
            variant="caption"
            style={{ color: colors.onSurfaceVariant }}
          >
            {t('home.welcomeBack')}
          </Typography>
          <Typography style={[styles.userName, { color: colors.text }]}>
            {user?.name}
          </Typography>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.locationButton,
            {
              backgroundColor: colors.surfaceContainer,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <MapPin size={12} color="#f59e0b" />
          <Typography
            variant="caption"
            style={[styles.locationText, { color: colors.text }]}
          >
            {location}
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.iconButton,
            {
              backgroundColor: colors.surfaceContainer,
              borderColor: colors.outlineVariant,
            },
          ]}
          onPress={() => router.push('/notifications')}
        >
          <Bell size={18} color={colors.text} />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#27272a',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    backgroundColor: '#22c55e',
    borderRadius: 7,
    borderWidth: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  locationText: {
    fontWeight: '600',
    fontSize: 11,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    backgroundColor: '#ef4444',
    borderRadius: 4,
  },
});
