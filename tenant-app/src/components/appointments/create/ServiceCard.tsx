import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Clock, Check } from 'lucide-react-native';
import { TYPOGRAPHY, SIZES, SHADOWS } from '@/src/constants/theme';
import { Service } from '@/src/types';
import { useTheme } from '@/src/hooks/useTheme';

interface Props {
  service: Service;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

export const ServiceCard = ({ service, isSelected, onToggle }: Props) => {
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
      onPress={() => onToggle(service.id)}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.leftInfo}>
          <Text style={[styles.name, { color: colors.primary }]}>
            {service.name}
          </Text>
          <View style={styles.metaRow}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border + '20',
                },
              ]}
            >
              <Clock size={12} color={colors.secondary} />
              <Text style={[styles.badgeText, { color: colors.secondary }]}>
                {service.duration_minutes} min
              </Text>
            </View>
            <Text style={[styles.category, { color: colors.outline }]}>
              {service.category_name}
            </Text>
          </View>
        </View>

        <View style={styles.rightInfo}>
          <Text
            style={[
              styles.price,
              { color: isSelected ? colors.primary : colors.secondary },
            ]}
          >
            ${parseFloat(service.base_price).toFixed(2)}
          </Text>
          <View
            style={[
              styles.checkbox,
              {
                borderColor: isSelected
                  ? colors.primary
                  : colors.outlineVariant,
                backgroundColor: isSelected ? colors.primary : colors.card,
              },
            ]}
          >
            {isSelected && (
              <Check size={14} color={colors.onPrimary} strokeWidth={4} />
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
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
  },
  category: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  rightInfo: {
    alignItems: 'flex-end',
    gap: 8,
  },
  price: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
