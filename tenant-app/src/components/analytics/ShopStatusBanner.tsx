import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, Text } from 'react-native';
import { SHADOWS, TYPOGRAPHY, SIZES } from '@/src/constants/theme';
import { Staff } from '@/src/types';
import { useTheme } from '@/src/hooks/useTheme';

const AVATAR_COLORS = [
  '#10B981',
  '#3B82F6',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
];

function getStaffInitials(staff: Staff): string {
  return `${staff.first_name[0]}${staff.last_name[0]}`.toUpperCase();
}

function getStaffColor(staffId: string): string {
  let hash = 0;
  for (let i = 0; i < staffId.length; i++) {
    hash = (hash * 31 + staffId.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface ShopStatusBannerProps {
  chairsActive: number;
  activeStaff?: Staff[];
}

const MAX_VISIBLE = 3;

export const ShopStatusBanner = ({
  chairsActive,
  activeStaff = [],
}: ShopStatusBannerProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const visibleStaff = activeStaff.slice(0, MAX_VISIBLE);
  const extraCount = activeStaff.length - MAX_VISIBLE;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.primaryContainer },
        SHADOWS.md,
      ]}
    >
      <View style={styles.decorator} />
      <View style={styles.content}>
        <Text
          style={[styles.label, { color: colors.onPrimaryContainer + 'CC' }]}
        >
          {t('analytics.shopStatus.online').toUpperCase()}
        </Text>
        <Text style={[styles.statusText, { color: colors.onPrimaryContainer }]}>
          {t('dashboard.chairsActive', { count: chairsActive })}
        </Text>
      </View>

      <View style={styles.avatarGroup}>
        {visibleStaff.map((staff, index) => (
          <View
            key={staff.id}
            style={[
              styles.avatar,
              {
                backgroundColor: getStaffColor(staff.id),
                zIndex: 10 - index,
                borderColor: colors.primaryContainer,
              },
              index > 0 && { marginLeft: -12 },
            ]}
          >
            <Text style={[styles.avatarText, { color: colors.white }]}>
              {getStaffInitials(staff)}
            </Text>
          </View>
        ))}
        {extraCount > 0 && (
          <View
            style={[
              styles.avatar,
              styles.moreAvatar,
              {
                backgroundColor: colors.surfaceContainerHighest,
                borderColor: colors.primaryContainer,
                marginLeft: -12,
              },
            ]}
          >
            <Text style={[styles.avatarText, { color: colors.onSurface }]}>
              +{extraCount}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginHorizontal: SIZES.md,
    marginTop: SIZES.md,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  decorator: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  content: {
    gap: 0,
    zIndex: 10,
  },
  label: {
    ...TYPOGRAPHY.label,
    fontWeight: '900',
    letterSpacing: 1,
    fontSize: 10,
  },
  statusText: {
    ...TYPOGRAPHY.h3,
    fontWeight: '900',
    fontSize: 22,
    marginTop: 2,
  },
  avatarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...TYPOGRAPHY.label,
    fontWeight: '900',
    fontSize: 11,
  },
  moreAvatar: {
    paddingBottom: 1,
  },
});
