import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Typography } from '@/src/components/ui';
import { COLORS, SIZES, TYPOGRAPHY } from '@/src/constants/theme';

interface PhoneInputProps {
  label: string;
  phoneNumber: string;
  onPhoneNumberChange: (text: string) => void;
}

export const PhoneInput = ({
  label,
  phoneNumber,
  onPhoneNumberChange,
}: PhoneInputProps) => {
  return (
    <View style={styles.container}>
      <Typography variant="caption" style={styles.label}>
        {label}
      </Typography>
      <View style={styles.inputContainer}>
        <View style={styles.countryIndicator}>
          <Typography variant="label" style={styles.countryName}>
            TR
          </Typography>
          <Typography variant="label" style={styles.countryCode}>
            +90
          </Typography>
        </View>

        <View style={styles.divider} />

        <TextInput
          style={[styles.input, TYPOGRAPHY.h3]}
          placeholder="000 000 0000"
          placeholderTextColor={COLORS.outline}
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={onPhoneNumberChange}
          autoFocus
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.lg,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: SIZES.sm,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainer,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
    height: 64,
    overflow: 'hidden',
  },
  countryIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    backgroundColor: COLORS.surfaceContainerLow,
    height: '100%',
  },
  countryName: {
    fontWeight: '700',
    fontSize: 14,
    color: COLORS.onSurface,
    marginRight: 6,
  },
  countryCode: {
    fontWeight: '500',
    fontSize: 14,
    color: COLORS.onSurface,
    marginRight: 4,
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: COLORS.outlineVariant,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: SIZES.md,
    color: COLORS.onSurface,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
