import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ShieldCheck, Lock } from 'lucide-react-native';
import { COLORS, SIZES } from '@/src/constants/theme';

export const AuthFooter = () => {
  return (
    <View style={styles.container}>
      <View style={styles.divider} />
      <View style={styles.icons}>
        <ShieldCheck size={18} color={COLORS.onSurfaceVariant} />
        <Lock size={18} color={COLORS.onSurfaceVariant} />
      </View>
      <View style={styles.divider} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    paddingVertical: SIZES.xl,
    marginTop: SIZES.md,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.outlineVariant,
    opacity: 0.3,
  },
  icons: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
});
