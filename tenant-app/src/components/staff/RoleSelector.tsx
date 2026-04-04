import { CheckCircle2, Scissors, ShieldCheck } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '@/src/constants/theme';
import { StaffRole } from '@/src/hooks/staff/useAddStaff';
import { useTranslation } from 'react-i18next';

interface RoleSelectorProps {
  role: StaffRole;
  setRole: (role: StaffRole) => void;
}

export const RoleSelector = ({ role, setRole }: RoleSelectorProps) => {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('settings.staff.create.systemRole')}</Text>
      <View style={styles.grid}>
        {/* Staff Role */}
        <TouchableOpacity
          style={[styles.card, role === 'staff' && styles.cardActive]}
          onPress={() => setRole('staff')}
          activeOpacity={0.9}
        >
          <View style={styles.cardHeader}>
            <View
              style={[styles.iconBox, role === 'staff' && styles.iconBoxActive]}
            >
              <Scissors
                size={24}
                color={role === 'staff' ? COLORS.white : COLORS.primary}
              />
            </View>
            <Text
              style={[styles.roleTitle, role === 'staff' && styles.textWhite]}
            >
              {t('settings.staff.create.roleStaff')}
            </Text>
          </View>
          <Text
            style={[styles.roleDesc, role === 'staff' && styles.textWhiteDim]}
          >
            {t('settings.staff.create.roleStaffSub')}
          </Text>
          {role === 'staff' && (
            <View style={styles.checkIcon}>
              <CheckCircle2 size={20} color={COLORS.white} />
            </View>
          )}
        </TouchableOpacity>

        {/* Admin Role */}
        <TouchableOpacity
          style={[styles.card, role === 'admin' && styles.cardActive]}
          onPress={() => setRole('admin')}
          activeOpacity={0.9}
        >
          <View style={styles.cardHeader}>
            <View
              style={[styles.iconBox, role === 'admin' && styles.iconBoxActive]}
            >
              <ShieldCheck
                size={24}
                color={role === 'admin' ? COLORS.white : COLORS.primary}
              />
            </View>
            <Text
              style={[styles.roleTitle, role === 'admin' && styles.textWhite]}
            >
              {t('settings.staff.create.roleAdmin')}
            </Text>
          </View>
          <Text
            style={[styles.roleDesc, role === 'admin' && styles.textWhiteDim]}
          >
            {t('settings.staff.create.roleAdminSub')}
          </Text>
          {role === 'admin' && (
            <View style={styles.checkIcon}>
              <CheckCircle2 size={20} color={COLORS.white} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginLeft: 4,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'column',
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 20,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  cardActive: {
    backgroundColor: COLORS.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  iconBox: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  iconBoxActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  roleDesc: {
    fontSize: 11,
    color: COLORS.secondary,
    lineHeight: 16,
    fontWeight: '500',
    maxWidth: '85%',
  },
  textWhite: {
    color: COLORS.white,
  },
  textWhiteDim: {
    color: COLORS.white,
    opacity: 0.8,
  },
  checkIcon: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
});
