import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Screen } from '@/src/components/common/Screen';
import { Button, Typography } from '@/src/components/ui';
import { COLORS, SIZES, TYPOGRAPHY } from '@/src/constants/theme';
import { useRequestOtp } from '@/src/hooks/mutations/useAuthMutations';

export default function PhoneLoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const { mutate: requestOtp, isPending } = useRequestOtp();

  const handleSendOTP = () => {
    if (phoneNumber.length < 10) return;

    const fullPhoneNumber = `90${phoneNumber}`;

    requestOtp(
      { phone_number: fullPhoneNumber },
      {
        onSuccess: (response: any) => {
          router.push({
            pathname: '/(auth)/otp-verification',
            params: {
              phone: fullPhoneNumber,
            },
          });
        },
        onError: (error: any) => {
          console.error('OTP request failed', error);
        },
      },
    );
  };

  return (
    <Screen headerTitle={t('auth.loginTitle')} scrollable>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <View style={styles.content}>
          <Typography variant="h2" style={styles.title}>
            {t('auth.phoneNumberTitle')}
          </Typography>
          <Typography variant="body" color={COLORS.secondary}>
            {t('auth.phoneNumberSubtitle')}
          </Typography>

          <View style={[styles.inputContainer, { borderColor: COLORS.border }]}>
            <View style={styles.countryCode}>
              <Typography variant="body" color={COLORS.secondary}>
                {t('auth.countryCode')}
              </Typography>
            </View>
            <View style={styles.divider} />
            <TextInput
              style={[styles.input, TYPOGRAPHY.h3]}
              placeholder={t('auth.phonePlaceholder')}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              autoFocus
            />
          </View>

          <Button
            title={t('auth.sendCode')}
            loading={isPending}
            onPress={handleSendOTP}
            disabled={phoneNumber.length < 10}
            style={styles.button}
          />

          <Typography variant="caption" color={COLORS.secondary} align="center">
            {t('auth.ratesNote')}
          </Typography>
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
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SIZES.xl,
    paddingHorizontal: SIZES.md,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    height: 64,
  },
  countryCode: {
    paddingHorizontal: SIZES.sm,
  },
  divider: {
    width: 1,
    height: '40%',
    backgroundColor: COLORS.border,
    marginHorizontal: SIZES.sm,
  },
  input: {
    flex: 1,
    padding: 0,
    color: COLORS.text,
  },
  button: {
    marginTop: SIZES.md,
    marginBottom: SIZES.lg,
  },
});
