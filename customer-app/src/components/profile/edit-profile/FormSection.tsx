import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, TextInput, StyleSheet } from 'react-native';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';
import { SIZES, TYPOGRAPHY } from '@/src/constants/theme';

interface FormSectionProps {
  firstName: string;
  setFirstName: (text: string) => void;
  lastName: string;
  setLastName: (text: string) => void;
}

export const FormSection: React.FC<FormSectionProps> = ({
  firstName,
  setFirstName,
  lastName,
  setLastName,
}) => {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  return (
    <View style={styles.container}>
      {/* First Name */}
      <View style={styles.inputGroup}>
        <Typography
          variant="caption"
          style={[styles.label, { color: isDark ? '#71717a' : '#a1a1aa' }]}
        >
          {t('profile.firstName').toUpperCase()}
        </Typography>
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: isDark
                ? 'rgba(24, 24, 27, 0.6)'
                : 'rgba(244, 244, 245, 0.8)',
              borderColor: isDark
                ? 'rgba(39, 39, 42, 0.8)'
                : 'rgba(228, 228, 231, 0.8)',
            },
          ]}
        >
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder={t('profile.firstName')}
            placeholderTextColor={isDark ? '#52525b' : '#a1a1aa'}
            style={[styles.input, { color: isDark ? '#fff' : '#18181b' }]}
          />
        </View>
      </View>

      {/* Last Name */}
      <View style={styles.inputGroup}>
        <Typography
          variant="caption"
          style={[styles.label, { color: isDark ? '#71717a' : '#a1a1aa' }]}
        >
          {t('profile.lastName').toUpperCase()}
        </Typography>
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: isDark
                ? 'rgba(24, 24, 27, 0.6)'
                : 'rgba(244, 244, 245, 0.8)',
              borderColor: isDark
                ? 'rgba(39, 39, 42, 0.8)'
                : 'rgba(228, 228, 231, 0.8)',
            },
          ]}
        >
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder={t('profile.lastName')}
            placeholderTextColor={isDark ? '#52525b' : '#a1a1aa'}
            style={[styles.input, { color: isDark ? '#fff' : '#18181b' }]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SIZES.md,
    gap: 24,
  },
  inputGroup: {
    gap: 8,
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
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  input: {
    ...TYPOGRAPHY.body,
    fontSize: 18,
    fontWeight: '500',
    height: '100%',
  },
});
