import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Star, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, TYPOGRAPHY, SIZES, SHADOWS } from '@/src/constants/theme';
import { Staff } from '@/src/types';

interface Props {
  staff: Staff;
  isSelected: boolean;
  onSelect: (staff: Staff) => void;
}

export const ProfessionalCard = ({ staff, isSelected, onSelect }: Props) => {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selectedContainer,
        !isSelected && styles.unselectedContainer,
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
                style={[styles.avatar, { grayscale: 1 } as any]} // Simulating grayscale for inactive but we can use real images
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {staff.first_name[0]}
                  {staff.last_name[0]}
                </Text>
              </View>
            )}
            {staff.status === 'active' && <View style={styles.statusDot} />}
          </View>
          <View>
            <Text style={styles.name}>
              {staff.first_name} {staff.last_name}
            </Text>
            <Text style={styles.role}>
              {staff.role === 'admin'
                ? t('appointmentCreate.masterBarber')
                : t('appointmentCreate.barberArtisan')}
            </Text>
            <View style={styles.ratingRow}>
              <Star
                size={14}
                color={COLORS.tertiaryContainer}
                fill={COLORS.tertiaryContainer}
              />
              <Text style={styles.rating}>{staff.avg_rating.toFixed(1)}</Text>
              <Text style={styles.reviews}>
                {t('appointmentCreate.reviewCount', {
                  count: staff.review_count,
                })}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.selectionIndicator}>
          {isSelected ? (
            <View style={styles.checkBadge}>
              <Check size={18} color={COLORS.white} strokeWidth={3} />
            </View>
          ) : (
            <View style={styles.emptyCircle} />
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
    borderColor: 'transparent',
  },
  selectedContainer: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceContainerLowest,
    ...SHADOWS.sm,
  },
  unselectedContainer: {
    backgroundColor: COLORS.surfaceContainerLow,
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
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: SIZES.radius + 8,
    backgroundColor: COLORS.surfaceContainerHighest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.onSurfaceVariant,
  },
  statusDot: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    backgroundColor: '#10B981', // emerald-500
    borderWidth: 3,
    borderColor: COLORS.white,
    borderRadius: 10,
  },
  name: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  role: {
    ...TYPOGRAPHY.label,
    fontWeight: '600',
    color: COLORS.secondary,
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
    color: COLORS.primary,
  },
  reviews: {
    ...TYPOGRAPHY.caption,
    color: COLORS.outline,
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
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
  },
});
