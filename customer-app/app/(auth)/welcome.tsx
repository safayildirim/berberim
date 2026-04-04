import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import { Screen } from '@/src/components/common/Screen';
import { Button, Typography } from '@/src/components/ui';
import { COLORS, IMAGES, SIZES } from '@/src/constants/theme';
import { useTenantStore } from '@/src/store/useTenantStore';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { config } = useTenantStore();

  if (!config) return null;

  return (
    <Screen style={styles.container} transparentStatusBar>
      <View style={styles.topSection}>
        <Image
          source={{ uri: config.branding.logo_url || IMAGES.defaultLogo }}
          style={styles.logo}
        />
        <View style={styles.overlay} />
        <View style={styles.content}>
          <Typography variant="h1" color={COLORS.white} align="center">
            {config.name}
          </Typography>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <Typography variant="h2" align="center">
          {t('auth.welcomeTitle')}
        </Typography>
        <Typography
          variant="body"
          color={COLORS.secondary}
          align="center"
          style={styles.description}
        >
          {t('auth.welcomeSubtitle')}
        </Typography>

        <Button
          title={t('auth.loginWithPhone')}
          onPress={() => router.push('/(auth)/phone-login')}
          style={styles.button}
        />

        <Typography variant="caption" color={COLORS.secondary} align="center">
          {t('auth.termsNote')}
        </Typography>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
  },
  topSection: {
    height: width * 1.2,
    width: '100%',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    opacity: 0.7,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  content: {
    padding: SIZES.padding * 2,
    zIndex: 1,
  },
  bottomSection: {
    flex: 1,
    padding: SIZES.padding * 1.5,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    justifyContent: 'space-between',
    paddingBottom: SIZES.padding * 2,
  },
  description: {
    marginTop: SIZES.sm,
  },
  button: {
    marginVertical: SIZES.md,
  },
});
