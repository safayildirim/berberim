import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Star, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { TYPOGRAPHY, SIZES, SHADOWS } from '@/src/constants/theme';
import { Staff } from '@/src/types';
import { useTheme } from '@/src/hooks/useTheme';

interface Props {
  staff: Staff;
  isSelected: boolean;
  onSelect: (staff: Staff) => void;
}

export const ProfessionalCard = ({ staff, isSelected, onSelect }: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          borderColor: isSelected ? colors.primary : 'transparent',
          backgroundColor: isSelected
            ? colors.surfaceContainerLowest
            : colors.surfaceContainerLow,
        },
        isSelected && SHADOWS.sm,
      ]}
      onPress={() => onSelect(staff)}
      activeOpacity={0.8}
    >
      <View style={styles.topRow}>
        <View style={styles.leftContent}>
          <View style={styles.avatarContainer}>
            {staff.avatar_url ? (
              <Image
                source={{ uri: staff.avatar_url }}
                style={[
                  styles.avatar,
                  { backgroundColor: colors.surfaceContainerHigh },
                ]}
              />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: colors.surfaceContainerHighest },
                ]}
              >
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {staff.first_name[0]}
                  {staff.last_name[0]}
                </Text>
              </View>
            )}
            {staff.status === 'active' && (
              <View
                style={[styles.statusDot, { borderColor: colors.background }]}
              />
            )}
          </View>
          <View>
            <Text style={[styles.name, { color: colors.primary }]}>
              {staff.first_name} {staff.last_name}
            </Text>
            <Text style={[styles.role, { color: colors.secondary }]}>
              {staff.role === 'admin'
                ? t('appointmentCreate.masterBarber')
                : t('appointmentCreate.barberArtisan')}
            </Text>
            <View style={styles.ratingRow}>
              <Star size={14} color={colors.warning} fill={colors.warning} />
              <Text style={[styles.rating, { color: colors.primary }]}>
                {staff.avg_rating.toFixed(1)}
              </Text>
              <Text style={[styles.reviews, { color: colors.outline }]}>
                {t('appointmentCreate.reviewCount', {
                  count: staff.review_count,
                })}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.selectionIndicator}>
          {isSelected ? (
            <View
              style={[styles.checkBadge, { backgroundColor: colors.primary }]}
            >
              <Check size={18} color={colors.onPrimary} strokeWidth={3} />
            </View>
          ) : (
            <View
              style={[
                styles.emptyCircle,
                { borderColor: colors.outlineVariant },
              ]}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SIZES.md + 4,
    borderRadius: SIZES.radius + 12,
    marginBottom: SIZES.md,
    borderWidth: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md + 4,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: SIZES.radius + 8,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: SIZES.radius + 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...TYPOGRAPHY.h3,
  },
  statusDot: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    backgroundColor: '#10B981', // emerald-500
    borderWidth: 3,
    borderRadius: 10,
  },
  name: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  role: {
    ...TYPOGRAPHY.label,
    fontWeight: '600',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  rating: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
  },
  reviews: {
    ...TYPOGRAPHY.caption,
    fontWeight: '500',
  },
  selectionIndicator: {
    width: 32,
    height: 32,
  },
  checkBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
  },
});
