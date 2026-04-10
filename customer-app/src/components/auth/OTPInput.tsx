import React from 'react';
import { StyleSheet, TextInput, View, Pressable } from 'react-native';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';

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
  const { isDark } = useTheme();
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
                {
                  backgroundColor: isDark
                    ? 'rgba(24, 24, 27, 0.6)'
                    : 'rgba(244, 244, 245, 0.8)',
                  borderColor: isFocused
                    ? isDark
                      ? '#ffffff'
                      : '#18181b'
                    : isDark
                      ? 'rgba(39, 39, 42, 0.8)'
                      : 'rgba(228, 228, 231, 1)',
                  borderWidth: isFocused ? 2 : 1,
                },
              ]}
            >
              <Typography
                style={[
                  styles.otpText,
                  { color: isDark ? '#ffffff' : '#18181b' },
                  !char && styles.otpPlaceholder,
                ]}
              >
                {char || (isFocused ? '' : '•')}
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
    marginVertical: 12,
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpText: {
    fontSize: 24,
    fontWeight: '700',
  },
  otpPlaceholder: {
    opacity: 0.2,
    fontSize: 16,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
});
