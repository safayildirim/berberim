import { Bell, Globe, HelpCircle, Lock } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '@/src/components/common/Screen';
import { LogoutButton } from '@/src/components/profile/LogoutButton';
import { LoyaltyBanner } from '@/src/components/profile/LoyaltyBanner';
import { ProfileHeader } from '@/src/components/profile/ProfileHeader';
import {
  SettingItem,
  SettingsSection,
} from '@/src/components/profile/SettingsComponents';
import { Typography } from '@/src/components/ui';
import { COLORS, SIZES } from '@/src/constants/theme';
import { useProfile } from '@/src/hooks/queries/useProfile';

export default function ProfileScreen() {
  const {
    user,
    wallet,
    primaryColor,
    t,
    i18n,
    handleLogout,
    toggleLanguage,
    navigateTo,
  } = useProfile();

  return (
    <Screen headerTitle={t('nav.profile')} scrollable style={styles.screen}>
      <ProfileHeader
        user={user!}
        onEdit={() => navigateTo('/profile/edit')}
        primaryColor={primaryColor}
      />

      <View style={styles.content}>
        <SettingsSection>
          <SettingItem
            label={t('profile.language')}
            subtitle={
              i18n.language.startsWith('tr') ? 'Türkçe' : 'English (US)'
            }
            icon={Globe}
            onPress={toggleLanguage}
          />
          <View style={styles.divider} />
          <SettingItem
            label={t('profile.notifications')}
            icon={Bell}
            onPress={() => navigateTo('/notifications')}
            rightElement={
              <View
                style={[
                  styles.toggleBackground,
                  { backgroundColor: `${primaryColor}1A` },
                ]}
              >
                <View
                  style={[
                    styles.toggleCircle,
                    { backgroundColor: primaryColor },
                  ]}
                />
              </View>
            }
          />
          <View style={styles.divider} />
          <SettingItem
            label={t('profile.security')}
            icon={Lock}
            onPress={() => {}}
          />
        </SettingsSection>

        <SettingsSection>
          <SettingItem
            label={t('profile.help')}
            icon={HelpCircle}
            onPress={() => {}}
          />
        </SettingsSection>

        <LogoutButton onPress={handleLogout} label={t('profile.logout')} />

        {wallet && (
          <LoyaltyBanner
            balance={wallet.current_points}
            onViewCard={() => navigateTo('/(tabs)/loyalty')}
            primaryColor={primaryColor}
            t={t}
          />
        )}

        <Typography
          variant="caption"
          color={COLORS.onSurfaceVariant}
          align="center"
          style={styles.version}
        >
          {t('profile.version')} 1.0.0 (Build 12)
        </Typography>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.xl * 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceContainerHigh,
    marginHorizontal: 16,
  },
  toggleBackground: {
    width: 40,
    height: 20,
    borderRadius: 10,
    position: 'relative',
    justifyContent: 'center',
  },
  toggleCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    right: 4,
  },
  version: {
    marginTop: SIZES.xl,
    opacity: 0.6,
  },
});
