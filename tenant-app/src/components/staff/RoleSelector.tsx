import { CheckCircle2, Scissors, ShieldCheck } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TYPOGRAPHY } from '@/src/constants/theme';
import { StaffRole } from '@/src/hooks/staff/useAddStaff';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/src/hooks/useTheme';

interface RoleSelectorProps {
  role: StaffRole;
  setRole: (role: StaffRole) => void;
}

export const RoleSelector = ({ role, setRole }: RoleSelectorProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.secondary }]}>
        {t('settings.staff.create.systemRole')}
      </Text>
      <View style={styles.grid}>
        {/* Staff Role */}
        <TouchableOpacity
          style={[
            styles.card,
            {
              backgroundColor:
                role === 'staff' ? colors.primary : colors.surfaceContainerHigh,
            },
          ]}
          onPress={() => setRole('staff')}
          activeOpacity={0.9}
        >
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor:
                    role === 'staff'
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(0,0,0,0.05)',
                },
              ]}
            >
              <Scissors
                size={24}
                color={role === 'staff' ? colors.onPrimary : colors.primary}
              />
            </View>
            <Text
              style={[
                styles.roleTitle,
                { color: role === 'staff' ? colors.onPrimary : colors.primary },
              ]}
            >
              {t('settings.staff.create.roleStaff')}
            </Text>
          </View>
          <Text
            style={[
              styles.roleDesc,
              {
                color: role === 'staff' ? colors.onPrimary : colors.secondary,
                opacity: role === 'staff' ? 0.8 : 1,
              },
            ]}
          >
            {t('settings.staff.create.roleStaffSub')}
          </Text>
          {role === 'staff' && (
            <View style={styles.checkIcon}>
              <CheckCircle2 size={20} color={colors.onPrimary} />
            </View>
          )}
        </TouchableOpacity>

        {/* Admin Role */}
        <TouchableOpacity
          style={[
            styles.card,
            {
              backgroundColor:
                role === 'admin' ? colors.primary : colors.surfaceContainerHigh,
            },
          ]}
          onPress={() => setRole('admin')}
          activeOpacity={0.9}
        >
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor:
                    role === 'admin'
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(0,0,0,0.05)',
                },
              ]}
            >
              <ShieldCheck
                size={24}
                color={role === 'admin' ? colors.onPrimary : colors.primary}
              />
            </View>
            <Text
              style={[
                styles.roleTitle,
                { color: role === 'admin' ? colors.onPrimary : colors.primary },
              ]}
            >
              {t('settings.staff.create.roleAdmin')}
            </Text>
          </View>
          <Text
            style={[
              styles.roleDesc,
              {
                color: role === 'admin' ? colors.onPrimary : colors.secondary,
                opacity: role === 'admin' ? 0.8 : 1,
              },
            ]}
          >
            {t('settings.staff.create.roleAdminSub')}
          </Text>
          {role === 'admin' && (
            <View style={styles.checkIcon}>
              <CheckCircle2 size={20} color={colors.onPrimary} />
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
    ...TYPOGRAPHY.label,
    fontSize: 10,
    fontWeight: '900',
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
    borderRadius: 20,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
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
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  roleDesc: {
    ...TYPOGRAPHY.body,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
    maxWidth: '85%',
  },
  checkIcon: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
});
