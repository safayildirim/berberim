import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/src/components/common/Screen';
import { Typography, Button } from '@/src/components/ui';
import { SIZES, COLORS, TYPOGRAPHY } from '@/src/constants/theme';
import { useVerifyOtp } from '@/src/hooks/mutations/useAuthMutations';

export default function OTPVerificationScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { phone } = useLocalSearchParams<{
    phone: string;
  }>();
  const [code, setCode] = useState('');
  const { mutate: verifyOtp, isPending, error: mutationError } = useVerifyOtp();

  const handleVerify = () => {
    if (code.length < 6) return;

    verifyOtp(
      { phone_number: phone as string, code: code },
      {
        onSuccess: () => {
          router.replace('/(tabs)');
        },
      },
    );
  };

  return (
    <Screen headerTitle={t('auth.verifyCode')}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <View style={styles.content}>
          <Typography variant="h2" style={styles.title}>
            {t('auth.enterOTP')}
          </Typography>
          <Typography variant="body" color={COLORS.secondary}>
            {t('auth.otpSentTo', { phone })}
          </Typography>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, TYPOGRAPHY.h1, { letterSpacing: SIZES.lg }]}
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={(text) => {
                setCode(text);
                if (text.length === 6) handleVerify();
              }}
              autoFocus
              secureTextEntry={false}
            />
          </View>

          {mutationError && (
            <Typography
              variant="label"
              color={COLORS.error}
              align="center"
              style={styles.error}
            >
              {(mutationError as any).message || t('auth.invalidOTP')}
            </Typography>
          )}

          <Button
            title={t('auth.verifyCode')}
            loading={isPending}
            onPress={handleVerify}
            disabled={code.length < 6}
            style={styles.button}
          />

          <View style={styles.resendContainer}>
            <Typography variant="body" color={COLORS.secondary}>
              {t('auth.didNotReceive')}
            </Typography>
            <Button
              title={t('auth.resendOTP')}
              variant="ghost"
              onPress={() => {}}
              style={styles.resendButton}
              size="sm"
            />
          </View>
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
    paddingTop: SIZES.lg,
  },
  title: {
    marginBottom: SIZES.sm,
  },
  inputContainer: {
    marginVertical: SIZES.xl,
    alignItems: 'center',
    paddingVertical: SIZES.md,
  },
  input: {
    width: '100%',
    textAlign: 'center',
    letterSpacing: SIZES.lg,
  },
  error: {
    marginBottom: SIZES.md,
  },
  button: {
    marginTop: SIZES.md,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.xl,
  },
  resendButton: {
    marginLeft: SIZES.xs,
  },
});
