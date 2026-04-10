import React from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Screen } from '@/src/components/common/Screen';
import { Button, Typography } from '@/src/components/ui';
import { COLORS, SIZES } from '@/src/constants/theme';
import { AuthHero } from '@/src/components/auth/AuthHero';
import { PhoneInput } from '@/src/components/auth/PhoneInput';
import { BrandShowcase } from '@/src/components/auth/BrandShowcase';
import { AuthFooter } from '@/src/components/auth/AuthFooter';
import { usePhoneLogin } from '@/src/hooks/usePhoneLogin';
import { useTenantStore } from '@/src/store/useTenantStore';

export default function PhoneLoginScreen() {
  const { t } = useTranslation();
  const { getBranding } = useTenantStore();
  const branding = getBranding();
  const { phoneNumber, setPhoneNumber, handleSendOTP, isPending, isValid } =
    usePhoneLogin();

  return (
    <Screen headerTitle={branding?.name} showHeaderBack scrollable>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <View style={styles.content}>
          <AuthHero
            welcomeText={t('auth.welcome')}
            title={branding?.name}
            subtitle={t('auth.phoneNumberSubtitle')}
          />

          <View style={styles.formSection}>
            <PhoneInput
              label={t('auth.phoneNumber')}
              phoneNumber={phoneNumber}
              onPhoneNumberChange={setPhoneNumber}
            />

            <View style={styles.actions}>
              <Button
                title={t('auth.sendCode')}
                loading={isPending}
                onPress={handleSendOTP}
                disabled={!isValid}
                style={styles.button}
                titleStyle={styles.buttonText}
              />

              <Typography
                variant="caption"
                color={COLORS.onSurfaceVariant}
                align="center"
                style={styles.ratesNote}
              >
                {t('auth.ratesNote')}
              </Typography>
            </View>
          </View>

          <BrandShowcase />

          <AuthFooter />
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
    paddingTop: SIZES.xl,
    paddingHorizontal: SIZES.md,
  },
  formSection: {
    marginBottom: SIZES.xl,
  },
  actions: {
    marginTop: SIZES.lg,
  },
  button: {
    backgroundColor: COLORS.primary,
    height: 64,
    borderRadius: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  ratesNote: {
    marginTop: SIZES.md,
    lineHeight: 18,
    fontSize: 11,
    paddingHorizontal: SIZES.md,
  },
});
