import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Phone } from 'lucide-react-native';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';
import { useTranslation } from 'react-i18next';

interface WelcomeBottomSheetProps {
  onLoginPress: () => void;
}

export const WelcomeBottomSheet: React.FC<WelcomeBottomSheetProps> = ({
  onLoginPress,
}) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#121212' : '#ffffff' },
      ]}
    >
      {/* Drag Handle Indicator */}
      <View
        style={[
          styles.dragHandle,
          { backgroundColor: isDark ? '#27272a' : '#e4e4e7' },
        ]}
      />

      <Typography
        style={[styles.title, { color: isDark ? '#ffffff' : '#18181b' }]}
      >
        {t('auth.welcomeTitle')}
      </Typography>

      <Typography
        style={[styles.description, { color: isDark ? '#a1a1aa' : '#71717a' }]}
      >
        {t('auth.welcomeSubtitle')}
      </Typography>

      <TouchableOpacity
        onPress={onLoginPress}
        activeOpacity={0.9}
        style={[
          styles.button,
          { backgroundColor: isDark ? '#ffffff' : '#1c3f2d' },
        ]}
      >
        <Phone
          size={20}
          color={isDark ? '#1c3f2d' : '#ffffff'}
          strokeWidth={2.5}
        />
        <Typography
          style={[styles.buttonText, { color: isDark ? '#1c3f2d' : '#ffffff' }]}
        >
          {t('auth.loginWithPhone')}
        </Typography>
      </TouchableOpacity>

      <Typography
        variant="caption"
        align="center"
        style={[styles.terms, { color: isDark ? '#71717a' : '#a1a1aa' }]}
      >
        {t('auth.termsNote')}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 48,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 0.1,
    shadowRadius: 40,
    elevation: 20,
  },
  dragHandle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    top: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    maxWidth: 280,
    fontWeight: '500',
  },
  button: {
    width: '100%',
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#1c3f2d',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
  },
  terms: {
    marginTop: 32,
    lineHeight: 18,
    paddingHorizontal: 16,
    fontWeight: '500',
  },
});
