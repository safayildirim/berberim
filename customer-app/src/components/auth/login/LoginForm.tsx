import React from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ChevronDown, ArrowRight } from 'lucide-react-native';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';
import { useTranslation } from 'react-i18next';
import { TYPOGRAPHY } from '@/src/constants/theme';

interface LoginFormProps {
  phoneNumber: string;
  onPhoneNumberChange: (text: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  isValid: boolean;
  hasError: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  phoneNumber,
  onPhoneNumberChange,
  onSubmit,
  isPending,
  isValid,
  hasError,
}) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {/* Phone Input Box */}
      <View style={styles.inputGroup}>
        <Typography
          variant="caption"
          style={[styles.label, { color: isDark ? '#71717a' : '#a1a1aa' }]}
        >
          {t('auth.phoneNumber').toUpperCase()}
        </Typography>

        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: isDark
                ? 'rgba(24, 24, 27, 0.6)'
                : 'rgba(244, 244, 245, 0.8)',
              borderColor: hasError
                ? '#ef4444'
                : isDark
                  ? 'rgba(39, 39, 42, 0.8)'
                  : 'rgba(228, 228, 231, 0.8)',
            },
          ]}
        >
          {/* Country Code */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.countrySelector,
              {
                backgroundColor: isDark
                  ? 'rgba(39, 39, 42, 0.4)'
                  : 'rgba(228, 228, 231, 0.4)',
                borderColor: isDark
                  ? 'rgba(39, 39, 42, 0.8)'
                  : 'rgba(228, 228, 231, 0.8)',
              },
            ]}
          >
            <Typography
              style={[
                styles.countrySmall,
                { color: isDark ? '#71717a' : '#a1a1aa' },
              ]}
            >
              TR
            </Typography>
            <Typography
              style={[
                styles.countryCode,
                { color: isDark ? '#fff' : '#18181b' },
              ]}
            >
              +90
            </Typography>
            <ChevronDown size={16} color={isDark ? '#52525b' : '#a1a1aa'} />
          </TouchableOpacity>

          {/* Number Input */}
          <TextInput
            value={phoneNumber}
            onChangeText={onPhoneNumberChange}
            placeholder="555 000 0000"
            placeholderTextColor={isDark ? '#3f3f46' : '#d4d4d8'}
            keyboardType="phone-pad"
            style={[styles.input, { color: isDark ? '#fff' : '#18181b' }]}
          />
        </View>
        {hasError && (
          <Typography variant="caption" style={styles.errorText}>
            {t('auth.invalidPhone')}
          </Typography>
        )}
      </View>

      {/* Action Button */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          onPress={onSubmit}
          disabled={!isValid || isPending}
          activeOpacity={0.8}
          style={[
            styles.button,
            { backgroundColor: isDark ? '#ffffff' : '#18181b' },
            (!isValid || isPending) && styles.buttonDisabled,
          ]}
        >
          {isPending ? (
            <ActivityIndicator color={isDark ? '#000' : '#fff'} />
          ) : (
            <View style={styles.buttonRow}>
              <Typography
                style={[styles.buttonText, { color: isDark ? '#000' : '#fff' }]}
              >
                {t('auth.sendCode')}
              </Typography>
              <ArrowRight size={18} color={isDark ? '#000' : '#fff'} />
            </View>
          )}
        </TouchableOpacity>

        <Typography
          variant="caption"
          align="center"
          style={[styles.ratesNote, { color: isDark ? '#52525b' : '#a1a1aa' }]}
        >
          {t('auth.ratesNote')}
        </Typography>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    gap: 32,
  },
  inputGroup: {
    gap: 12,
  },
  label: {
    fontWeight: '800',
    letterSpacing: 2,
    marginLeft: 4,
  },
  inputWrapper: {
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  countrySelector: {
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRightWidth: 1,
    gap: 8,
  },
  countrySmall: {
    fontSize: 12,
    fontWeight: '700',
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    ...TYPOGRAPHY.body,
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 20,
    letterSpacing: 1,
  },
  actionSection: {
    gap: 20,
  },
  button: {
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
  },
  ratesNote: {
    lineHeight: 18,
    fontWeight: '500',
    paddingHorizontal: 10,
  },
  errorText: {
    color: '#ef4444',
    marginLeft: 4,
  },
});
