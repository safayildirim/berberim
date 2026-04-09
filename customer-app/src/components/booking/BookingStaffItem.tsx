import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check, Star, UserCircle } from 'lucide-react-native';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';

interface BookingStaffItemProps {
  name: string;
  specialty?: string;
  rating?: number;
  reviews?: number;
  avatarUrl?: string;
  isSelected: boolean;
  onSelect: () => void;
  isAnyStaff?: boolean;
}

export const BookingStaffItem = ({
  name,
  specialty,
  rating,
  reviews,
  avatarUrl,
  isSelected,
  onSelect,
  isAnyStaff,
}: BookingStaffItemProps) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onSelect}
      style={[
        styles.container,
        {
          backgroundColor: isSelected
            ? isDark
              ? 'rgba(245, 158, 11, 0.1)'
              : '#fffbeb'
            : colors.card,
          borderColor: isSelected ? '#f59e0b' : colors.outlineVariant,
        },
      ]}
    >
      <View style={styles.avatarWrapper}>
        {isAnyStaff ? (
          <View
            style={[
              styles.anyStaffIcon,
              {
                backgroundColor: isDark ? '#18181b' : '#f4f4f5',
                borderColor: isDark ? '#27272a' : '#e5e7eb',
              },
            ]}
          >
            <UserCircle size={28} color={isDark ? '#52525b' : '#a1a1aa'} />
          </View>
        ) : (
          <Image
            source={{
              uri:
                avatarUrl ||
                'https://images.unsplash.com/photo-1618077360395-f3068be8e001?w=200&h=200&fit=crop',
            }}
            style={[styles.avatar, { borderColor: colors.outlineVariant }]}
          />
        )}
      </View>

      <View style={styles.info}>
        <Typography variant="h3" style={[styles.name, { color: colors.text }]}>
          {name}
        </Typography>
        <Typography
          variant="caption"
          style={{ color: colors.onSurfaceVariant }}
        >
          {isAnyStaff ? t('booking.anyAvailableDesc') : specialty}
        </Typography>
        {!isAnyStaff && rating !== undefined && (
          <View style={styles.ratingRow}>
            <Star size={12} color="#f59e0b" fill="#f59e0b" />
            <Typography
              variant="caption"
              style={[styles.ratingText, { color: colors.text }]}
            >
              {rating}
            </Typography>
            <Typography
              variant="caption"
              style={{ color: colors.onSurfaceVariant, fontSize: 10 }}
            >
              ({reviews})
            </Typography>
          </View>
        )}
      </View>

      {isSelected && (
        <View style={styles.checkIcon}>
          <Check size={20} color="#f59e0b" strokeWidth={3} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
    marginBottom: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
  },
  anyStaffIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontWeight: '700',
    fontSize: 12,
  },
  checkIcon: {
    marginLeft: 'auto',
  },
});
