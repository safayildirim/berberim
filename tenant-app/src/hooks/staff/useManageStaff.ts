import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { adminService } from '@/src/services/admin.service';
import { useStaffDetail } from '@/src/hooks/queries/useStaff';
import { useTranslation } from 'react-i18next';
import { StaffRole } from './useAddStaff';

export const useManageStaff = (id: string) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: staff, isLoading } = useStaffDetail(id);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRole>('staff');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (staff) {
      setFirstName(staff.first_name);
      setLastName(staff.last_name);
      setEmail(staff.email);
      setRole(staff.role as StaffRole);
    }
  }, [staff]);

  const handleUpdate = async () => {
    if (!firstName || !lastName || !email) {
      Alert.alert(t('common.error'), t('settings.staff.create.missingFields'));
      return;
    }

    setIsSubmitting(true);
    try {
      await adminService.updateStaff(id, {
        first_name: firstName,
        last_name: lastName,
        email,
        role,
      });
      Alert.alert(
        t('common.success'),
        t('settings.staff.manage.successUpdate'),
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (error: any) {
      const message =
        error.response?.data?.message || t('settings.staff.manage.errorUpdate');
      Alert.alert(t('common.error'), message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      t('settings.staff.manage.confirmDeleteTitle'),
      t('settings.staff.manage.confirmDeleteSub'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.staff.manage.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.deleteStaff(id);
              Alert.alert(
                t('common.success'),
                t('settings.staff.manage.successDelete'),
                [{ text: 'OK', onPress: () => router.replace('/staff') }],
              );
            } catch {
              Alert.alert(
                t('common.error'),
                t('settings.staff.manage.errorDelete'),
              );
            }
          },
        },
      ],
    );
  };

  return {
    form: {
      firstName,
      setFirstName,
      lastName,
      setLastName,
      email,
      setEmail,
      role,
      setRole,
    },
    ui: {
      isLoading,
      isSubmitting,
    },
    actions: {
      handleUpdate,
      handleDelete,
    },
    staff,
  };
};
