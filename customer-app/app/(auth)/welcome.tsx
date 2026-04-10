import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { Screen } from '@/src/components/common/Screen';
import { HeroSection } from '@/src/components/auth/welcome/HeroSection';
import { WelcomeBottomSheet } from '@/src/components/auth/welcome/WelcomeBottomSheet';
import { useTheme } from '@/src/store/useThemeStore';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isDark } = useTheme();

  const handleLoginPress = () => {
    router.push('/(auth)/phone-login');
  };

  return (
    <Screen
      style={[
        styles.container,
        { backgroundColor: isDark ? '#000000' : '#ffffff' },
      ]}
      transparentStatusBar
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />

      {/* Fake Dynamic Island */}
      <View
        style={[
          styles.dynamicIsland,
          {
            backgroundColor: isDark
              ? 'rgba(0, 0, 0, 0.9)'
              : 'rgba(24, 24, 27, 0.9)',
          },
        ]}
      />

      <HeroSection />

      <View style={styles.contentContainer}>
        <View style={styles.spacer} />
        <WelcomeBottomSheet onLoginPress={handleLoginPress} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    zIndex: 10,
  },
  dynamicIsland: {
    position: 'absolute',
    top: 12,
    left: '50%',
    marginLeft: -64,
    width: 128,
    height: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    zIndex: 100,
  },
  spacer: {
    flex: 1,
  },
});
