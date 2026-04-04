import { Eye, EyeOff } from 'lucide-react-native';
import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '@/src/constants/theme';
import { RoleSelector } from './RoleSelector';
import { StaffRole } from '@/src/hooks/staff/useAddStaff';
import { useTranslation } from 'react-i18next';

interface AccountAccessSectionProps {
  password: string;
  setPassword: (text: string) => void;
  showPassword: boolean;
  togglePasswordVisibility: () => void;
  role: StaffRole;
  setRole: (role: StaffRole) => void;
}
export const AccountAccessSection = ({
  password,
  setPassword,
  showPassword,
  togglePasswordVisibility,
  role,
  setRole,
}: AccountAccessSectionProps) => {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.indicator} />
        <Text style={styles.sectionTitle}>
          {t('settings.staff.create.accountAccess')}
        </Text>
      </View>

      <View style={styles.formCard}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            {t('settings.staff.create.tempPassword')}
          </Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={COLORS.onSurfaceVariant + '40'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={togglePasswordVisibility}
              style={styles.eyeBtn}
            >
              {showPassword ? (
                <EyeOff size={20} color={COLORS.secondary} />
              ) : (
                <Eye size={20} color={COLORS.secondary} />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>
            {t('settings.staff.create.passwordHint')}
          </Text>
        </View>

        <RoleSelector role={role} setRole={setRole} />
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
    borderRadius: 32,
    gap: 32,
  },
  inputContainer: {
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerHigh,
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  eyeBtn: {
    padding: 4,
  },
  hint: {
    fontSize: 11,
    color: COLORS.secondary,
    opacity: 0.7,
    marginTop: 4,
    fontWeight: '600',
    marginLeft: 4,
  },
});
