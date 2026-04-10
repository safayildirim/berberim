import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking } from 'react-native';
import { useSessionStore } from '@/src/lib/auth/session-store';
import { useTenantStore } from '@/src/store/useTenantStore';
import { useLogout } from '@/src/hooks/mutations/useAuthMutations';
import {
  useUpdateProfile,
  useUploadAvatar,
} from '@/src/hooks/mutations/useProfileMutations';
import { useLoyaltyWallet } from '@/src/hooks/queries/useLoyalty';

export const useProfile = () => {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { user } = useSessionStore();
  const { mutate: logout } = useLogout();
  const { data: wallet } = useLoyaltyWallet();
  const { config, getBranding } = useTenantStore();
  const { primaryColor } = getBranding();
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();
  const { mutateAsync: uploadAvatar, isPending: isUploadingAvatar } =
    useUploadAvatar();

  // Form State (for Edit Profile)
  const [firstName, setFirstName] = useState(user?.profile.first_name || '');
  const [lastName, setLastName] = useState(user?.profile.last_name || '');
  const [avatar, setAvatar] = useState(user?.profile.avatar_url || '');

  const [saved, setSaved] = useState(false);

  const toggleLanguage = async () => {
    const nextLang = i18n.language.startsWith('tr') ? 'en' : 'tr';
    await i18n.changeLanguage(nextLang);
    await AsyncStorage.setItem('berberim-customer-language', nextLang);
  };

  const handleLogout = () => {
    Alert.alert(t('profile.logout'), t('profile.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.logout'),
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

  const isLocalUri = (uri: string) =>
    uri.startsWith('file://') || uri.startsWith('ph://');

  const handleSave = async () => {
    if (!firstName || !lastName) {
      Alert.alert(t('common.error'), t('common.unexpectedError'));
      return;
    }

    try {
      // Upload avatar if user picked a new local image
      if (avatar && isLocalUri(avatar)) {
        await uploadAvatar(avatar);
      }

      updateProfile(
        { first_name: firstName, last_name: lastName },
        {
          onSuccess: () => {
            setSaved(true);
            setTimeout(() => {
              setSaved(false);
              router.back();
            }, 2000);
          },
          onError: () => {
            Alert.alert(t('common.error'), t('common.unexpectedError'));
          },
        },
      );
    } catch {
      Alert.alert(t('common.error'), t('common.unexpectedError'));
    }
  };

  const handlePickImage = () => {
    Alert.alert(t('profile.changePhoto'), '', [
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
      {
        text: t('profile.camera'),
        onPress: () => launchCamera(),
      },
      {
        text: t('profile.gallery'),
        onPress: () => launchImageLibrary(),
      },
    ]);
  };

  const launchCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        t('profile.permissionDenied'),
        t('profile.cameraPermissionMsg'),
        [
          { text: t('common.settings'), onPress: () => Linking.openSettings() },
          { text: t('common.done') },
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
        t('profile.permissionDenied'),
        t('profile.galleryPermissionMsg'),
        [
          { text: t('common.settings'), onPress: () => Linking.openSettings() },
          { text: t('common.done') },
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

  const navigateTo = (path: string) => {
    router.push(path as any);
  };

  return {
    user,
    config,
    wallet,
    primaryColor,
    t,
    i18n,
    handleLogout,
    toggleLanguage,
    navigateTo,
    // Edit Profile specific
    firstName,
    setFirstName,
    lastName,
    setLastName,
    avatar,
    setAvatar,
    isUpdating: isUpdating || isUploadingAvatar,
    saved,
    handleSave,
    handlePickImage,
    tenantName: config?.name || 'Berberim',
  };
};
