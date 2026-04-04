import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS } from '@/src/constants/theme';
import { useTranslation } from 'react-i18next';

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
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.indicator} />
        <Text style={styles.sectionTitle}>
          {t('settings.staff.create.personalInfo')}
        </Text>
      </View>

      <View style={styles.formCard}>
        <View style={styles.row}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              {t('settings.staff.create.firstName')}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={t('settings.staff.create.firstNamePh')}
              placeholderTextColor={COLORS.onSurfaceVariant + '40'}
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              {t('settings.staff.create.lastName')}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={t('settings.staff.create.lastNamePh')}
              placeholderTextColor={COLORS.onSurfaceVariant + '40'}
              value={lastName}
              onChangeText={setLastName}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            {t('settings.staff.create.workEmail')}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={t('settings.staff.create.emailPh')}
            placeholderTextColor={COLORS.onSurfaceVariant + '40'}
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
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  formCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    padding: 24,
    borderRadius: 24,
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
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginLeft: 4,
  },
  input: {
    backgroundColor: COLORS.surfaceContainerHigh,
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
});
