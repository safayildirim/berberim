import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Typography } from '@/src/components/ui';
import { COLORS, SIZES } from '@/src/constants/theme';

interface AuthHeroProps {
  welcomeText: string;
  title: string;
  subtitle: string;
}

export const AuthHero = ({ welcomeText, title, subtitle }: AuthHeroProps) => {
  return (
    <View style={styles.container}>
      <Typography variant="caption" style={styles.welcome}>
        {welcomeText}
      </Typography>
      <Typography variant="h1" style={styles.title}>
        {title}
      </Typography>
      <Typography
        variant="body"
        color={COLORS.onSurfaceVariant}
        style={styles.subtitle}
      >
        {subtitle}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.xl * 1.5,
  },
  welcome: {
    color: COLORS.secondary,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: SIZES.xs,
    fontSize: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  subtitle: {
    maxWidth: 280,
    lineHeight: 22,
    fontSize: 15,
  },
});
