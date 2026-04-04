import { LogOut } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { COLORS, SIZES } from '@/src/constants/theme';
import { Typography } from '@/src/components/ui';

interface LogoutButtonProps {
  onPress: () => void;
  label: string;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  onPress,
  label,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.container}
    >
      <View style={styles.content}>
        <LogOut
          size={22}
          color={COLORS.error}
          strokeWidth={2.5}
          pointerEvents="none"
        />
        <Typography variant="body" color={COLORS.error} style={styles.label}>
          {label}
        </Typography>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(186, 26, 26, 0.1)',
    marginTop: SIZES.lg,
    paddingVertical: SIZES.lg,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    fontWeight: '800',
    fontSize: 16,
    color: COLORS.error,
  },
});
