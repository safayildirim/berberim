import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
  Bell,
  CalendarOff,
  ChevronRight,
  Edit2,
  ExternalLink,
  FileText,
  Gift,
  Globe,
  Link2,
  HelpCircle,
  LogOut,
  Moon,
  Scissors,
  ShieldCheck,
  Store,
  TrendingUp,
  User,
  UserCircle,
  Users,
} from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/src/components/common/Screen';
import { SHADOWS, TYPOGRAPHY } from '@/src/constants/theme';
import { useLogout } from '@/src/hooks/mutations/useAuthMutations';
import { avatarService } from '@/src/services/avatar.service';
import { useSessionStore } from '@/src/store/useSessionStore';
import { useTheme } from '@/src/hooks/useTheme';

export default function MoreScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, tenant, isAdmin, setUser } = useSessionStore();
  const { mutateAsync: logout } = useLogout();
  const { colors, toggleTheme, isDark } = useTheme();
  const [avatarLocal, setAvatarLocal] = React.useState('');

  const handlePickAvatar = () => {
    Alert.alert(t('profile.changePhoto') || 'Change Photo', '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.camera') || 'Camera',
        onPress: () => launchCamera(),
      },
      {
        text: t('profile.gallery') || 'Gallery',
        onPress: () => launchGallery(),
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
          { text: 'OK' },
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
      uploadAvatar(result.assets[0].uri);
    }
  };

  const launchGallery = async () => {
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
          { text: 'OK' },
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
      uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    setAvatarLocal(uri);
    try {
      const avatarUrl = await avatarService.upload(uri);
      if (user) setUser({ ...user, avatar_url: avatarUrl });
    } catch {
      setAvatarLocal('');
      Alert.alert(
        t('common.error'),
        t('common.unexpectedError') || 'Upload failed',
      );
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('common.logout'),
      t('auth.logoutConfirmation', 'Are you sure you want to log out?'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.done'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ],
    );
  };

  const toggleLanguage = async () => {
    const nextLang = i18n.language.startsWith('tr') ? 'en' : 'tr';
    await i18n.changeLanguage(nextLang);
    await AsyncStorage.setItem('berberim-tenant-language', nextLang);
  };

  const BentoSection = ({
    title,
    icon: Icon,
    badge,
    children,
    style,
  }: {
    title: string;
    icon?: any;
    badge?: string;
    children: React.ReactNode;
    style?: any;
  }) => (
    <View
      style={[
        styles.bentoSection,
        { backgroundColor: colors.surfaceContainerLow },
        style,
      ]}
    >
      <View style={styles.bentoHeader}>
        <Text style={[styles.bentoTitle, { color: colors.primary }]}>
          {title}
        </Text>
        {badge ? (
          <View
            style={[
              styles.bentoBadge,
              { backgroundColor: colors.primary + '20' },
            ]}
          >
            <Text style={[styles.bentoBadgeText, { color: colors.primary }]}>
              {badge}
            </Text>
          </View>
        ) : Icon ? (
          <Icon size={20} color={colors.secondary} opacity={0.5} />
        ) : null}
      </View>
      <View style={styles.bentoContent}>{children}</View>
    </View>
  );

  const BentoItem = ({
    icon: Icon,
    title,
    onPress,
    rightContent,
    small = false,
  }: {
    icon: any;
    title: string;
    onPress?: () => void;
    rightContent?: React.ReactNode;
    small?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.bentoItem,
        { backgroundColor: colors.background },
        small && styles.bentoItemSmall,
      ]}
      onPress={onPress}
    >
      <View style={styles.bentoItemMain}>
        <View
          style={[
            styles.bentoIconBox,
            { backgroundColor: colors.primary + '15' },
          ]}
        >
          <Icon size={18} color={colors.primary} />
        </View>
        <Text
          style={[
            styles.bentoItemTitle,
            { color: colors.primary },
            small && styles.bentoItemTitleSmall,
          ]}
        >
          {small ? title.toUpperCase() : title}
        </Text>
      </View>
      {rightContent || (
        <ChevronRight size={18} color={colors.secondary} opacity={0.5} />
      )}
    </TouchableOpacity>
  );

  return (
    <Screen
      style={[styles.container, { backgroundColor: colors.background }]}
      withPadding={false}
      transparentStatusBar
      headerTitle={tenant?.name}
      headerSubtitle={t('nav.more')}
      showNotification
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 100 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <View
              style={[
                styles.avatarBorder,
                { borderColor: colors.surfaceContainerLow },
              ]}
            >
              {avatarLocal || user?.avatar_url ? (
                <Image
                  source={{ uri: avatarLocal || user?.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                <View
                  style={[
                    styles.avatarPlaceholder,
                    { backgroundColor: colors.surfaceContainerLow },
                  ]}
                >
                  <UserCircle
                    size={80}
                    color={colors.primary}
                    strokeWidth={1}
                  />
                </View>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.editAvatarBtn,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.background,
                },
              ]}
              onPress={handlePickAvatar}
            >
              <Edit2 size={14} color={colors.onPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.profileName, { color: colors.primary }]}>
                {user?.first_name} {user?.last_name}
              </Text>
              <View
                style={[
                  styles.roleBadge,
                  user?.role === 'admin'
                    ? { backgroundColor: colors.primary }
                    : {
                        backgroundColor: colors.surfaceContainerHigh,
                        borderWidth: 1,
                        borderColor: colors.border + '15',
                      },
                ]}
              >
                {user?.role === 'admin' ? (
                  <ShieldCheck
                    size={12}
                    color={colors.onPrimary}
                    strokeWidth={3}
                  />
                ) : (
                  <User size={12} color={colors.primary} strokeWidth={3} />
                )}
                <Text
                  style={[
                    styles.roleText,
                    user?.role === 'admin'
                      ? { color: colors.onPrimary }
                      : { color: colors.primary },
                  ]}
                >
                  {user?.role === 'admin' ? 'Admin' : 'Staff'}
                </Text>
              </View>
            </View>

            <View style={styles.shopRow}>
              <Store size={16} color={colors.secondary} />
              <Text style={[styles.shopName, { color: colors.secondary }]}>
                {tenant?.name || 'The Master Barber Atelier'}
              </Text>
            </View>
          </View>
        </View>

        {/* Bento Operational Grid */}
        <View style={styles.bentoGrid}>
          {/* Account Section */}
          <BentoSection title={t('settings.sections.account')} icon={User}>
            <BentoItem
              icon={UserCircle}
              title={t('settings.items.personal')}
              onPress={() => router.push('/profile/edit')}
            />
            <BentoItem
              icon={CalendarOff}
              title={t('settings.items.vacation')}
              onPress={() => router.push(`/staff/${user?.id}/leaves` as any)}
            />
          </BentoSection>

          {/* Business Management Section */}
          {isAdmin() && (
            <BentoSection
              title={t('settings.sections.business')}
              badge={t('settings.adminExclusive')}
              style={[styles.adminSection, { borderLeftColor: colors.primary }]}
            >
              <BentoItem
                icon={Users}
                title={t('settings.items.staff')}
                small
                onPress={() => router.push('/staff' as any)}
              />
              <BentoItem
                icon={Scissors}
                title={t('settings.items.catalog')}
                small
                onPress={() => router.push('/services' as any)}
              />
              <BentoItem
                icon={Link2}
                title={t('settings.items.linkCodes', 'Bağlantı Kodları')}
                small
                onPress={() => router.push('/link-codes' as any)}
              />
              <BentoItem
                icon={Gift}
                title={t('settings.items.loyalty')}
                small
                onPress={() => {}}
              />
              <BentoItem
                icon={TrendingUp}
                title={t('settings.items.analytics')}
                small
                onPress={() => router.push('/analytics' as any)}
              />
            </BentoSection>
          )}

          {/* Preferences */}
          <BentoSection title={t('settings.sections.preferences')}>
            <BentoItem
              icon={Bell}
              title={t('settings.items.notifications')}
              onPress={() => {}}
            />
            <BentoItem
              icon={Moon}
              title={t('settings.items.darkMode')}
              onPress={toggleTheme}
              rightContent={
                <View
                  style={[
                    styles.toggleTrack,
                    {
                      backgroundColor: isDark
                        ? colors.primary
                        : colors.border + '30',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      {
                        backgroundColor: colors.white,
                        alignSelf: isDark ? 'flex-end' : 'flex-start',
                      },
                    ]}
                  />
                </View>
              }
            />
            <BentoItem
              icon={Globe}
              title={t('settings.items.language')}
              onPress={toggleLanguage}
              rightContent={
                <Text style={[styles.langValue, { color: colors.primary }]}>
                  {i18n.language.startsWith('tr')
                    ? 'Türkçe (TR)'
                    : 'English (US)'}
                </Text>
              }
            />
          </BentoSection>

          {/* Support & Legal */}
          <BentoSection title={t('settings.sections.support')}>
            <BentoItem
              icon={HelpCircle}
              title={t('settings.items.help')}
              rightContent={
                <ExternalLink
                  size={16}
                  color={colors.secondary}
                  opacity={0.5}
                />
              }
            />
            <BentoItem icon={FileText} title={t('settings.items.terms')} />
            <BentoItem icon={ShieldCheck} title={t('settings.items.privacy')} />
          </BentoSection>
        </View>

        {/* Logout Action */}
        <View style={styles.logoutWrapper}>
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: colors.error + '15' }]}
            onPress={handleLogout}
          >
            <LogOut size={20} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>
              {t('settings.logout')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 32,
  },
  profileSection: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 24,
  },
  avatarBorder: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  profileInfo: {
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  profileName: {
    ...TYPOGRAPHY.h1,
    fontSize: 32,
    letterSpacing: -1,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    ...SHADOWS.sm,
  },
  roleText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shopName: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 16,
  },
  bentoGrid: {
    paddingHorizontal: 24,
    gap: 24,
  },
  bentoSection: {
    borderRadius: 32,
    padding: 24,
  },
  adminSection: {
    borderLeftWidth: 4,
  },
  bentoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  bentoTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 18,
  },
  bentoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bentoBadgeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '900',
    letterSpacing: 1,
  },
  bentoContent: {
    gap: 4,
  },
  bentoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  bentoItemMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bentoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoItemTitle: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 14,
  },
  bentoItemSmall: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
    minWidth: '45%',
    padding: 16,
    marginBottom: 0,
  },
  bentoItemTitleSmall: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  toggleTrack: {
    width: 40,
    height: 20,
    borderRadius: 10,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  langValue: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 11,
  },
  logoutWrapper: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 100,
  },
  logoutText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});
