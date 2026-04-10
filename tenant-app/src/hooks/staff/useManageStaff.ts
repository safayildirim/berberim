import { useState, useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { adminService } from '@/src/services/admin.service';
import { avatarService } from '@/src/services/avatar.service';
import { useStaffDetail } from '@/src/hooks/queries/useStaff';
import { useTranslation } from 'react-i18next';
import { StaffRole } from '@/src/hooks/staff/useAddStaff';

export const useManageStaff = (id: string) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: staff, isLoading, refetch } = useStaffDetail(id);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRole>('staff');
  const [avatar, setAvatar] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (staff) {
      setFirstName(staff.first_name);
      setLastName(staff.last_name);
      setEmail(staff.email);
      setRole(staff.role as StaffRole);
      setAvatar(staff.avatar_url || '');
    }
  }, [staff]);

  const isLocalUri = (uri: string) =>
    uri.startsWith('file://') || uri.startsWith('ph://');

  const handlePickImage = () => {
    Alert.alert(t('profile.changePhoto') || 'Change Photo', '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.camera') || 'Camera',
        onPress: () => launchCamera(),
      },
      {
        text: t('profile.gallery') || 'Gallery',
        onPress: () => launchImageLibrary(),
      },
    ]);
  };

  const launchCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('profile.permissionDenied') || 'Permission Denied',
        t('profile.cameraPermissionMsg') || 'Camera access is required.',
        [
          {
            text: t('common.settings') || 'Settings',
            onPress: () => Linking.openSettings(),
          },
          { text: t('common.done') || 'OK' },
        ],
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const launchImageLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('profile.permissionDenied') || 'Permission Denied',
        t('profile.galleryPermissionMsg') || 'Gallery access is required.',
        [
          {
            text: t('common.settings') || 'Settings',
            onPress: () => Linking.openSettings(),
          },
          { text: t('common.done') || 'OK' },
        ],
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleUpdate = async () => {
    if (!firstName || !lastName || !email) {
      Alert.alert(t('common.error'), t('settings.staff.create.missingFields'));
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload avatar if user picked a new local image
      if (avatar && isLocalUri(avatar)) {
        await avatarService.upload(avatar);
      }

      await adminService.updateStaff(id, {
        first_name: firstName,
        last_name: lastName,
        email,
        role,
      });
      await refetch();
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
      avatar,
    },
    ui: {
      isLoading,
      isSubmitting,
    },
    actions: {
      handleUpdate,
      handleDelete,
      handlePickImage,
    },
    staff,
  };
};
