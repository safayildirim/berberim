import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS, TYPOGRAPHY, SIZES, SHADOWS } from '@/src/constants/theme';
import { Staff } from '@/src/types';

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
  const visibleStaff = activeStaff.slice(0, MAX_VISIBLE);
  const extraCount = activeStaff.length - MAX_VISIBLE;

  return (
    <View style={[styles.container, SHADOWS.md]}>
      <View style={styles.decorator} />
      <View style={styles.content}>
        <Text style={styles.label}>{t('analytics.shopStatus.online')}</Text>
        <Text style={styles.statusText}>
          {t('dashboard.chairsActive', { count: chairsActive })}
        </Text>
      </View>

      <View style={styles.avatarGroup}>
        {visibleStaff.map((staff, index) => (
          <View
            key={staff.id}
            style={[
              styles.avatar,
              { backgroundColor: getStaffColor(staff.id), zIndex: 10 - index },
              index > 0 && { marginLeft: -12 },
            ]}
          >
            <Text style={styles.avatarText}>{getStaffInitials(staff)}</Text>
          </View>
        ))}
        {extraCount > 0 && (
          <View style={[styles.avatar, styles.moreAvatar, { marginLeft: -12 }]}>
            <Text style={styles.avatarText}>+{extraCount}</Text>
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
    backgroundColor: COLORS.primaryContainer,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: SIZES.md,
    marginTop: SIZES.md,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  decorator: {
    position: 'absolute',
    right: -60,
    top: -60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  content: {
    gap: 0,
    zIndex: 10,
  },
  label: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 10,
  },
  statusText: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
    color: COLORS.white,
    fontSize: 20,
    marginTop: 2,
  },
  avatarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '900',
    color: COLORS.white,
    fontSize: 10,
  },
  moreAvatar: {
    backgroundColor: '#334155', // slate-700
  },
});
