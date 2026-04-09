import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';

interface ProfileMenuItemProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress: () => void;
  isLast?: boolean;
}

export const ProfileMenuItem = ({
  icon,
  label,
  value,
  onPress,
  isLast,
}: ProfileMenuItemProps) => {
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.item,
        !isLast && {
          borderBottomWidth: 1,
          borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#f4f4f5',
        },
      ]}
    >
      <View style={styles.left}>
        <View style={styles.iconContainer}>{icon}</View>
        <Typography style={[styles.label, { color: colors.text }]}>
          {label}
        </Typography>
      </View>
      <View style={styles.right}>
        {value && (
          <Typography
            variant="body"
            style={[styles.value, { color: colors.onSurfaceVariant }]}
          >
            {value}
          </Typography>
        )}
        <ChevronRight size={18} color={isDark ? '#52525b' : '#a1a1aa'} />
      </View>
    </TouchableOpacity>
  );
};

interface ProfileMenuSectionProps {
  title: string;
  children: React.ReactNode;
}

export const ProfileMenuSection = ({
  title,
  children,
}: ProfileMenuSectionProps) => {
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <Typography variant="caption" style={styles.sectionTitle}>
        {title.toUpperCase()}
      </Typography>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.outlineVariant,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#71717a',
    letterSpacing: 1.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
});
