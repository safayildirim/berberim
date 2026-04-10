import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';
import { useTranslation } from 'react-i18next';
import { OTPInput } from '@/src/components/auth/OTPInput';

interface OTPFormProps {
  code: string;
  onCodeChange: (code: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  isValid: boolean;
  error?: string;
}

export const OTPForm: React.FC<OTPFormProps> = ({
  code,
  onCodeChange,
  onSubmit,
  isPending,
  isValid,
  error,
}) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.inputSection}>
        <OTPInput code={code} onCodeChange={onCodeChange} />

        {error && (
          <Typography
            variant="caption"
            style={[styles.errorText, { color: '#ef4444' }]}
            align="center"
          >
            {error}
          </Typography>
        )}
      </View>

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
                {t('auth.verify')}
              </Typography>
              <ArrowRight size={18} color={isDark ? '#000' : '#fff'} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    gap: 32,
  },
  inputSection: {
    gap: 12,
  },
  errorText: {
    fontWeight: '600',
    marginTop: -8,
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
});
