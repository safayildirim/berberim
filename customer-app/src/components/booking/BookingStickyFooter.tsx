import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BookingStickyFooterProps {
  label: string;
  value: string;
  buttonText: string;
  onPress: () => void;
  disabled?: boolean;
}

export const BookingStickyFooter = ({
  label,
  value,
  buttonText,
  onPress,
  disabled,
}: BookingStickyFooterProps) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#09090b' : '#fff',
          borderTopColor: colors.outlineVariant,
          paddingBottom: Math.max(insets.bottom, 20),
        },
      ]}
    >
      <View style={styles.content}>
        <View>
          <Typography
            variant="caption"
            style={{ color: colors.onSurfaceVariant }}
          >
            {label}
          </Typography>
          <Typography
            variant="h2"
            style={[styles.value, { color: colors.text }]}
          >
            {value}
          </Typography>
        </View>
        <TouchableOpacity
          onPress={onPress}
          disabled={disabled}
          style={[styles.button, { opacity: disabled ? 0.5 : 1 }]}
        >
          <Typography variant="label" style={styles.buttonText}>
            {buttonText}
          </Typography>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 20,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    fontSize: 24,
    fontWeight: '900',
  },
  button: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
  },
});
