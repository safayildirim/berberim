import React from 'react';
import { StyleSheet, TextInput, View, Pressable } from 'react-native';
import { Typography } from '@/src/components/ui';
import { COLORS, SIZES } from '@/src/constants/theme';

interface OTPInputProps {
  code: string;
  onCodeChange: (code: string) => void;
  maxLength?: number;
}

export const OTPInput = ({
  code,
  onCodeChange,
  maxLength = 6,
}: OTPInputProps) => {
  const inputRef = React.useRef<TextInput>(null);

  const handlePress = () => {
    inputRef.current?.focus();
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.otpGrid} onPress={handlePress}>
        {Array.from({ length: maxLength }).map((_, idx) => {
          const char = code[idx] || '';
          const isFocused = idx === code.length;

          return (
            <View
              key={idx}
              style={[
                styles.otpBox,
                isFocused && styles.otpBoxFocused,
                char !== '' && styles.otpBoxFilled,
              ]}
            >
              <Typography style={styles.otpText}>
                {char || (isFocused ? '' : '-')}
              </Typography>
            </View>
          );
        })}
      </Pressable>

      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={code}
        onChangeText={(text) => {
          if (text.length <= maxLength) {
            onCodeChange(text.replace(/[^0-9]/g, ''));
          }
        }}
        keyboardType="number-pad"
        maxLength={maxLength}
        autoFocus
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: SIZES.xl,
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 64,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  otpBoxFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  otpBoxFilled: {
    borderColor: 'transparent',
  },
  otpText: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
});
