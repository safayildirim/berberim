import { useState } from 'react';
import { Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useSessionStore } from '@/src/store/useSessionStore';
import { avatarService } from '@/src/services/avatar.service';
import { authService } from '@/src/services/auth.service';

export const useProfile = () => {
  const { user, setUser } = useSessionStore();
  const { t } = useTranslation();
  const router = useRouter();

  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar_url || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      let avatarUrl = avatar;
      if (avatar && isLocalUri(avatar)) {
        avatarUrl = await avatarService.upload(avatar);
      }

      const updatedUser = await authService.updateMe({
        first_name: firstName,
        last_name: lastName,
        email,
        avatar_url: avatarUrl,
      });

      setUser(updatedUser);

      Alert.alert(
        t('common.success'),
        t('settings.profile.successUpdate') || 'Profile updated successfully',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        t('settings.profile.errorUpdate') ||
        'Could not update profile';
      Alert.alert(t('common.error'), message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form: {
      firstName,
      setFirstName,
      lastName,
      setLastName,
      email,
      setEmail,
      avatar,
      setAvatar,
    },
    ui: {
      isSubmitting,
    },
    actions: {
      handleUpdate,
      handlePickImage,
    },
  };
};
