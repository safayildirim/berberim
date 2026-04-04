import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/src/constants/theme';
import { RoleSelector } from './RoleSelector';
import { StaffRole } from '@/src/hooks/staff/useAddStaff';
import { useTranslation } from 'react-i18next';

interface SystemRoleSectionProps {
  role: StaffRole;
  setRole: (role: StaffRole) => void;
}

export const SystemRoleSection = ({
  role,
  setRole,
}: SystemRoleSectionProps) => {
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
});
