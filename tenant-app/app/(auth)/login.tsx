import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, Mail, Scissors } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Screen } from '@/src/components/common/Screen';
import { COLORS, SHADOWS, SIZES, TYPOGRAPHY } from '@/src/constants/theme';
import { useLogin } from '@/src/hooks/mutations/useAuthMutations';
import { useTenantStore } from '@/src/store/useTenantStore';

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { getBranding } = useTenantStore();
  const branding = getBranding();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: login, isPending } = useLogin();

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert(
        'Missing fields',
        'Please enter your professional credentials.',
      );
      return;
    }

    login(
      {
        email,
        password,
        tenant_id: branding.id,
      },
      {
        onSuccess: () => {
          router.replace('/(tabs)/dashboard');
        },
        onError: (error: any) => {
          console.error('Login error:', error);
          Alert.alert(
            'Access Denied',
            error.response?.data?.message ||
              'Invalid email or password. Please try again.',
          );
        },
      },
    );
  };

  return (
    <Screen style={styles.container} scrollable={false} withPadding={false}>
      {/* Background Decorative Lines */}
      <View style={styles.bgLinesContainer} pointerEvents="none">
        <View style={[styles.bgLine, { top: -100, right: -100 }]} />
        <View style={[styles.bgLine, { top: 0, right: -200 }]} />
        <View style={[styles.bgLine, { top: 100, right: -300 }]} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.scroll}>
            {/* Branding Header */}
            <View style={styles.header}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: branding.primaryColor },
                  SHADOWS.md,
                ]}
              >
                <Scissors size={32} color={COLORS.white} strokeWidth={2.5} />
              </View>
              <Text style={[styles.title, { color: branding.primaryColor }]}>
                {branding.name}
              </Text>
              <Text style={styles.subtitle}>Digital Concierge Access</Text>
            </View>

            {/* Login Card */}
            <View style={[styles.card, SHADOWS.lg]}>
              <View style={styles.form}>
                {/* Email Field */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <Mail
                      size={20}
                      color={COLORS.onSurfaceVariant}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="name@atelier.com"
                      placeholderTextColor={COLORS.outlineVariant}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                {/* Password Field */}
                <View style={styles.inputContainer}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Password</Text>
                    <TouchableOpacity>
                      <Text style={styles.forgot}>Forgot Password?</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.inputWrapper}>
                    <Lock
                      size={20}
                      color={COLORS.onSurfaceVariant}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor={COLORS.outlineVariant}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color={COLORS.onSurfaceVariant} />
                      ) : (
                        <Eye size={20} color={COLORS.onSurfaceVariant} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Action Button */}
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={isPending}
                  activeOpacity={0.9}
                  style={styles.loginBtnContainer}
                >
                  <LinearGradient
                    colors={[
                      branding.primaryColor,
                      branding.secondaryColor || COLORS.primaryContainer,
                    ]}
                    style={styles.gradientBtn}
                  >
                    <Text style={styles.loginBtnText}>
                      {isPending ? t('common.loading') : t('auth.login')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Footer Links */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    Not a registered shop?{' '}
                    <Text style={styles.footerLink}>Apply for Atelier</Text>
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
  },
  bgLinesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: -1,
  },
  bgLine: {
    position: 'absolute',
    width: 1000,
    height: 120,
    backgroundColor: COLORS.tertiary,
    opacity: 0.03,
    transform: [{ rotate: '-45deg' }],
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SIZES.padding * 1.5,
    paddingTop: SIZES.xl * 2,
    paddingBottom: SIZES.xl * 2,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SIZES.xl * 2,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    ...TYPOGRAPHY.h1,
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -1,
    textAlign: 'center' as const,
  } as any,
  subtitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.secondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 4,
  } as any,
  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 32,
    padding: SIZES.lg * 1.5,
    width: '100%',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.2,
    marginLeft: 4,
    marginBottom: 8,
  },
  forgot: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.secondary,
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  loginBtnContainer: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  gradientBtn: {
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBtnText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 18,
  },
  footer: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  footerText: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
  },
  footerLink: {
    fontWeight: '900',
    color: COLORS.primary,
  },
});
