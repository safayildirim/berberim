import { ChevronRight, LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { COLORS, SIZES } from '@/src/constants/theme';
import { Typography } from '@/src/components/ui';

interface SettingItemProps {
  label: string;
  subtitle?: string;
  icon: LucideIcon;
  onPress: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
}

export const SettingItem: React.FC<SettingItemProps> = ({
  label,
  subtitle,
  icon: Icon,
  onPress,
  rightElement,
  showChevron = true,
}) => {
  return (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.itemLeft}>
        <View style={styles.iconContainer}>
          <Icon
            size={20}
            color={COLORS.onSurfaceVariant}
            strokeWidth={2.5}
            pointerEvents="none"
          />
        </View>
        <View style={styles.labelContainer}>
          <Typography variant="body" style={styles.label}>
            {label}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color={COLORS.onSurfaceVariant}>
              {subtitle}
            </Typography>
          )}
        </View>
      </View>
      <View style={styles.itemRight}>
        {rightElement}
        {showChevron && (
          <ChevronRight
            size={18}
            color={COLORS.outlineVariant}
            style={styles.chevron}
            pointerEvents="none"
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

export const SettingsSection: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <View style={styles.section}>{children}</View>;
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 8,
    marginBottom: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHigh,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  labelContainer: {
    justifyContent: 'center',
  },
  label: {
    fontWeight: '600',
    color: COLORS.text,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    marginLeft: 4,
  },
});
