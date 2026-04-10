import React from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  View,
  StatusBar,
} from 'react-native';
import { Screen } from '@/src/components/common/Screen';
import { OTPHeader } from '@/src/components/auth/otp/OTPHeader';
import { OTPForm } from '@/src/components/auth/otp/OTPForm';
import { OTPFooter } from '@/src/components/auth/otp/OTPFooter';
import { useOTPVerification } from '@/src/hooks/useOTPVerification';
import { useTheme } from '@/src/store/useThemeStore';
import { useTranslation } from 'react-i18next';

export default function OTPVerificationScreen() {
  const { isDark } = useTheme();
  const { t } = useTranslation();

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
    <Screen
      headerTitle={t('auth.verify')}
      showHeaderBack
      style={[
        styles.container,
        { backgroundColor: isDark ? '#000000' : '#ffffff' },
      ]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <View style={styles.content}>
          <OTPHeader phone={phone} />

          <OTPForm
            code={code}
            onCodeChange={setCode}
            onSubmit={handleVerify}
            isValid={isValid}
            isPending={isPending}
            error={(verifyError as any)?.message}
          />

          <OTPFooter
            timer={timer}
            canResend={canResend}
            onResend={handleResend}
            isResending={isResending}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
