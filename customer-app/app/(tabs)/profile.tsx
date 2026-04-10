import {
  BellRing,
  Globe,
  HelpCircle,
  Settings,
  Shield,
  Moon,
  Sun,
} from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Screen } from '@/src/components/common/Screen';
import { ProfileUserCard } from '@/src/components/profile/ProfileUserCard';
import {
  ProfileMenuItem,
  ProfileMenuSection,
} from '@/src/components/profile/ProfileMenuComponents';
import { LogoutButton } from '@/src/components/profile/LogoutButton';
import { Typography } from '@/src/components/ui';
import { useProfile } from '@/src/hooks/queries/useProfile';
import { useTheme } from '@/src/store/useThemeStore';

export default function ProfileScreen() {
  const { user, t, i18n, handleLogout, toggleLanguage, navigateTo } =
    useProfile();

  const { isDark, colors, toggleTheme, themeMode } = useTheme();

  return (
    <Screen
      headerTitle={t('nav.profile')}
      style={{ backgroundColor: colors.background }}
      transparentStatusBar
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ProfileUserCard
          name={
            user?.profile
              ? `${user.profile.first_name} ${user.profile.last_name}`
              : '---'
          }
          phone={user?.profile.phone_number || '---'}
          avatarUrl={user?.profile.avatar_url}
          onEdit={() => navigateTo('/profile/edit')}
        />

        <View style={styles.sections}>
          <ProfileMenuSection title={t('profile.editProfile')}>
            <ProfileMenuItem
              icon={
                <Settings size={20} color={isDark ? '#a1a1aa' : '#71717a'} />
              }
              label={t('profile.editProfile')}
              onPress={() => navigateTo('/profile/edit')}
            />
          </ProfileMenuSection>

          <ProfileMenuSection title={t('common.settings')}>
            <ProfileMenuItem
              icon={
                <BellRing size={20} color={isDark ? '#a1a1aa' : '#71717a'} />
              }
              label={t('profile.notifications')}
              onPress={() => navigateTo('/notifications')}
            />
            <ProfileMenuItem
              icon={<Globe size={20} color={isDark ? '#a1a1aa' : '#71717a'} />}
              label={t('profile.language')}
              value={i18n.language.startsWith('tr') ? 'Türkçe' : 'English'}
              onPress={toggleLanguage}
            />
            <ProfileMenuItem
              icon={
                themeMode === 'light' ? (
                  <Sun size={20} color={isDark ? '#a1a1aa' : '#71717a'} />
                ) : themeMode === 'dark' ? (
                  <Moon size={20} color={isDark ? '#a1a1aa' : '#71717a'} />
                ) : (
                  <Settings size={20} color={isDark ? '#a1a1aa' : '#71717a'} />
                )
              }
              label={t('profile.theme')}
              value={
                themeMode === 'system'
                  ? t('profile.themeSystem')
                  : themeMode === 'dark'
                    ? t('profile.themeDark')
                    : t('profile.themeLight')
              }
              onPress={toggleTheme}
              isLast
            />
          </ProfileMenuSection>

          <ProfileMenuSection title={t('profile.help')}>
            <ProfileMenuItem
              icon={
                <HelpCircle size={20} color={isDark ? '#a1a1aa' : '#71717a'} />
              }
              label={t('profile.help')}
              onPress={() => {}}
            />
            <ProfileMenuItem
              icon={<Shield size={20} color={isDark ? '#a1a1aa' : '#71717a'} />}
              label={t('campaigns.terms')}
              onPress={() => {}}
              isLast
            />
          </ProfileMenuSection>
        </View>

        <LogoutButton onPress={handleLogout} label={t('profile.logout')} />

        <Typography
          variant="caption"
          align="center"
          style={[styles.version, { color: colors.onSurfaceVariant }]}
        >
          {t('profile.version')} 1.0.0 (Build 12)
        </Typography>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  sections: {
    marginTop: 12,
  },
  version: {
    marginTop: 12,
    opacity: 0.5,
  },
});
