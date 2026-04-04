import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Clock, Check } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SIZES, SHADOWS } from '@/src/constants/theme';
import { Service } from '@/src/types';

interface Props {
  service: Service;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

export const ServiceCard = ({ service, isSelected, onToggle }: Props) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selectedContainer,
        !isSelected && styles.unselectedContainer,
      ]}
      onPress={() => onToggle(service.id)}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.leftInfo}>
          <Text style={styles.name}>{service.name}</Text>
          <View style={styles.metaRow}>
            <View style={styles.badge}>
              <Clock size={12} color={COLORS.secondary} />
              <Text style={styles.badgeText}>
                {service.duration_minutes} min
              </Text>
            </View>
            <Text style={styles.category}>{service.category_name}</Text>
          </View>
        </View>

        <View style={styles.rightInfo}>
          <Text style={[styles.price, isSelected && styles.selectedPrice]}>
            ${parseFloat(service.base_price).toFixed(2)}
          </Text>
          <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
            {isSelected && (
              <Check size={14} color={COLORS.white} strokeWidth={4} />
            )}
          </View>
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
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftInfo: {
    flex: 1,
    gap: 6,
  },
  name: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 17,
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHighest,
  },
  badgeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  category: {
    ...TYPOGRAPHY.caption,
    color: COLORS.outline,
    fontWeight: '600',
  },
  rightInfo: {
    alignItems: 'flex-end',
    gap: 8,
  },
  price: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 16,
    color: COLORS.secondary,
  },
  selectedPrice: {
    color: COLORS.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
});
