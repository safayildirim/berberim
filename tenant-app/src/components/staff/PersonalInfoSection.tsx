import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { TYPOGRAPHY } from '@/src/constants/theme';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/src/hooks/useTheme';

interface PersonalInfoSectionProps {
  firstName: string;
  setFirstName: (text: string) => void;
  lastName: string;
  setLastName: (text: string) => void;
  email: string;
  setEmail: (text: string) => void;
}
export const PersonalInfoSection = ({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
}: PersonalInfoSectionProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={[styles.indicator, { backgroundColor: colors.primary }]} />
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          {t('settings.staff.create.personalInfo').toUpperCase()}
        </Text>
      </View>

      <View
        style={[
          styles.formCard,
          { backgroundColor: colors.surfaceContainerLow },
        ]}
      >
        <View style={styles.row}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.secondary }]}>
              {t('settings.staff.create.firstName')}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceContainerHigh,
                  color: colors.primary,
                },
              ]}
              placeholder={t('settings.staff.create.firstNamePh')}
              placeholderTextColor={colors.outline + '40'}
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.secondary }]}>
              {t('settings.staff.create.lastName')}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceContainerHigh,
                  color: colors.primary,
                },
              ]}
              placeholder={t('settings.staff.create.lastNamePh')}
              placeholderTextColor={colors.outline + '40'}
              value={lastName}
              onChangeText={setLastName}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.secondary }]}>
            {t('settings.staff.create.workEmail')}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceContainerHigh,
                color: colors.primary,
              },
            ]}
            placeholder={t('settings.staff.create.emailPh')}
            placeholderTextColor={colors.outline + '40'}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  indicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
  },
  sectionTitle: {
    ...TYPOGRAPHY.label,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  formCard: {
    padding: 24,
    borderRadius: 32,
    gap: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 24,
  },
  inputContainer: {
    flex: 1,
    gap: 6,
  },
  label: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginLeft: 4,
  },
  input: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
});
