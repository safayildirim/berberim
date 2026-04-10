import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';
import { useTranslation } from 'react-i18next';

interface OTPFooterProps {
  timer: string;
  canResend: boolean;
  onResend: () => void;
  isResending: boolean;
}

export const OTPFooter: React.FC<OTPFooterProps> = ({
  timer,
  canResend,
  onResend,
  isResending,
}) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {!canResend ? (
        <Typography
          style={[styles.timerText, { color: isDark ? '#71717a' : '#a1a1aa' }]}
        >
          {t('auth.resendCodeIn', { timer })}
        </Typography>
      ) : (
        <TouchableOpacity
          onPress={onResend}
          disabled={isResending}
          activeOpacity={0.7}
          style={styles.resendButton}
        >
          <Typography
            style={[styles.resendText, { color: isDark ? '#fff' : '#18181b' }]}
          >
            {t('auth.resendOTP')}
          </Typography>
          <View
            style={[
              styles.underline,
              { backgroundColor: isDark ? '#fff' : '#18181b' },
            ]}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 'auto',
  },
  timerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resendButton: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  underline: {
    height: 1,
    width: '100%',
    marginTop: 4,
    opacity: 0.2,
  },
});
