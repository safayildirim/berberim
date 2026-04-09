import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Typography } from '@/src/components/ui';
import { COLORS, SIZES } from '@/src/constants/theme';
import { useTranslation } from 'react-i18next';

interface OTPResendProps {
  timer: string;
  canResend: boolean;
  onResend: () => void;
  isResending: boolean;
}

export const OTPResend = ({
  timer,
  canResend,
  onResend,
  isResending,
}: OTPResendProps) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {!canResend ? (
        <Typography
          variant="body"
          color={COLORS.onSurfaceVariant}
          style={styles.timerText}
        >
          {t('auth.resendCodeIn', { timer })}
        </Typography>
      ) : (
        <View style={styles.resendAction}>
          <TouchableOpacity
            onPress={onResend}
            disabled={isResending}
            style={styles.resendButton}
          >
            <Typography
              variant="body"
              color={COLORS.primary}
              style={styles.resendText}
            >
              {t('auth.resendOTP')}
            </Typography>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
    marginTop: SIZES.lg,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resendAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  resendButton: {
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.primary + '33', // Subtle underline
    paddingBottom: 2,
  },
  resendText: {
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
