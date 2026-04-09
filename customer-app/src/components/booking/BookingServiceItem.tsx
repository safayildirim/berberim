import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react-native';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';

interface BookingServiceItemProps {
  name: string;
  duration: number;
  price: string;
  isSelected: boolean;
  onToggle: () => void;
}

export const BookingServiceItem = ({
  name,
  duration,
  price,
  isSelected,
  onToggle,
}: BookingServiceItemProps) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onToggle}
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
      <View style={styles.content}>
        <Typography
          variant="h3"
          style={[styles.name, { color: isSelected ? '#d97706' : colors.text }]}
        >
          {name}
        </Typography>
        <Typography
          variant="caption"
          style={{ color: colors.onSurfaceVariant }}
        >
          {duration} {t('booking.minutes')} • {price}
        </Typography>
      </View>
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: isSelected ? '#f59e0b' : 'transparent',
            borderColor: isSelected
              ? '#f59e0b'
              : isDark
                ? '#3f3f46'
                : '#d4d4d8',
          },
        ]}
      >
        {isSelected && <Check size={14} color="#000" strokeWidth={3} />}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
