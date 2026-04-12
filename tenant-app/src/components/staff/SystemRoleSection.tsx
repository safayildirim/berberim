import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TYPOGRAPHY } from '@/src/constants/theme';
import { RoleSelector } from '@/src/components/staff/RoleSelector';
import { StaffRole } from '@/src/hooks/staff/useAddStaff';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/src/hooks/useTheme';

interface SystemRoleSectionProps {
  role: StaffRole;
  setRole: (role: StaffRole) => void;
}

export const SystemRoleSection = ({
  role,
  setRole,
}: SystemRoleSectionProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={[styles.indicator, { backgroundColor: colors.primary }]} />
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          {t('settings.staff.create.accountAccess').toUpperCase()}
        </Text>
      </View>

      <View
        style={[
          styles.formCard,
          { backgroundColor: colors.surfaceContainerLow },
        ]}
      >
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
    gap: 32,
  },
});
