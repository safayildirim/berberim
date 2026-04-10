import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  StatusBar,
} from 'react-native';
import { Screen } from '@/src/components/common/Screen';
import { LoginHero } from '@/src/components/auth/login/LoginHero';
import { LoginForm } from '@/src/components/auth/login/LoginForm';
import { usePhoneLogin } from '@/src/hooks/usePhoneLogin';
import { useTheme } from '@/src/store/useThemeStore';
import { useTranslation } from 'react-i18next';

export default function PhoneLoginScreen() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const { phoneNumber, setPhoneNumber, handleSendOTP, isPending, isValid } =
    usePhoneLogin();

  return (
    <Screen
      headerTitle={t('auth.login')}
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
          <LoginHero />

          <LoginForm
            phoneNumber={phoneNumber}
            onPhoneNumberChange={setPhoneNumber}
            onSubmit={handleSendOTP}
            isPending={isPending}
            isValid={isValid}
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
    paddingBottom: 40,
  },
});
