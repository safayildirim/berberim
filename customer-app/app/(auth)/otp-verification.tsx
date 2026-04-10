import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/src/components/common/Screen';
import { Typography, Button } from '@/src/components/ui';
import { SIZES, COLORS } from '@/src/constants/theme';
import { OTPInput } from '@/src/components/auth/OTPInput';
import { OTPResend } from '@/src/components/auth/OTPResend';
import { OTPBrandAnchor } from '@/src/components/auth/OTPBrandAnchor';
import { useOTPVerification } from '@/src/hooks/useOTPVerification';
import { useTenantStore } from '@/src/store/useTenantStore';

export default function OTPVerificationScreen() {
  const { t } = useTranslation();
  const { getBranding } = useTenantStore();
  const branding = getBranding();

  const {
    phone,
    code,
    setCode,
    timer,
    canResend,
    handleVerify,
    handleResend,
    isPending,
    isResending,
    verifyError,
    isValid,
  } = useOTPVerification();

  return (
    <Screen headerTitle={branding?.name} showHeaderBack scrollable>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <View style={styles.content}>
          {/* Header Text */}
          <View style={styles.headerText}>
            <Typography variant="h2" style={styles.title}>
              {t('auth.verifyCode')}
            </Typography>
            <Typography
              variant="body"
              color={COLORS.onSurfaceVariant}
              align="center"
              style={styles.subtitle}
            >
              {t('auth.otpSentTo', { phone })}
            </Typography>
          </View>

          {/* OTP Input */}
          <OTPInput
            code={code}
            onCodeChange={(nextCode) => {
              setCode(nextCode);
            }}
          />

          {verifyError && (
            <Typography
              variant="label"
              color={COLORS.error}
              align="center"
              style={styles.error}
            >
              {(verifyError as any).message || t('auth.invalidOTP')}
            </Typography>
          )}

          {/* Action Button */}
          <Button
            title={t('auth.verify')}
            loading={isPending}
            onPress={handleVerify}
            disabled={!isValid}
            style={[styles.button, !isValid && styles.buttonDisabled]}
            titleStyle={[
              styles.buttonText,
              !isValid && styles.buttonTextDisabled,
            ]}
          />

          {/* Resend Logic */}
          <OTPResend
            timer={timer}
            canResend={canResend}
            onResend={handleResend}
            isResending={isResending}
          />

          {/* Brand Anchor */}
          <OTPBrandAnchor />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: SIZES.xl * 2,
    paddingHorizontal: SIZES.md,
    alignItems: 'center',
  },
  headerText: {
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  title: {
    fontWeight: '900',
    fontSize: 28,
    color: COLORS.primary,
    marginBottom: SIZES.xs,
  },
  subtitle: {
    lineHeight: 22,
    maxWidth: 280,
  },
  error: {
    marginBottom: SIZES.md,
  },
  button: {
    width: '100%',
    height: 60,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    marginTop: SIZES.md,
  },
  buttonDisabled: {
    backgroundColor: COLORS.secondaryContainer,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
    color: COLORS.onPrimary,
  },
  buttonTextDisabled: {
    color: COLORS.onSecondaryContainer,
  },
});
