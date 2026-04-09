import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';

interface LogoutButtonProps {
  onPress: () => void;
  label: string;
}

export const LogoutButton = ({ onPress, label }: LogoutButtonProps) => {
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: colors.card,
          borderColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
        },
      ]}
    >
      <LogOut size={20} color={isDark ? '#f87171' : '#dc2626'} />
      <Typography
        variant="label"
        style={[styles.text, { color: isDark ? '#f87171' : '#b91c1c' }]}
      >
        {label}
      </Typography>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    marginTop: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    fontSize: 16,
    fontWeight: '800',
  },
});
