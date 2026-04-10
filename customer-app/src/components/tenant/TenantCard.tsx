import React from 'react';
import { View, StyleSheet, Image, Pressable } from 'react-native';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';
import { IMAGES } from '@/src/constants/theme';
import { TenantMembership } from '@/src/types';
import { ChevronRight } from 'lucide-react-native';

interface TenantCardProps {
  membership: TenantMembership;
  onPress: () => void;
}

export const TenantCard: React.FC<TenantCardProps> = ({
  membership,
  onPress,
}) => {
  const { isDark } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isDark
            ? 'rgba(24, 24, 27, 0.6)'
            : 'rgba(244, 244, 245, 0.8)',
          borderColor: isDark
            ? 'rgba(39, 39, 42, 0.8)'
            : 'rgba(228, 228, 231, 1)',
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: membership.logo_url || IMAGES.defaultLogo }}
          style={styles.logo}
        />
      </View>

      <View style={styles.info}>
        <Typography
          style={[styles.name, { color: isDark ? '#fff' : '#18181b' }]}
        >
          {membership.name}
        </Typography>
        <Typography
          variant="caption"
          style={[styles.slug, { color: isDark ? '#71717a' : '#a1a1aa' }]}
        >
          {membership.slug}
        </Typography>
      </View>

      <ChevronRight size={20} color={isDark ? '#3f3f46' : '#d4d4d8'} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  imageWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#000',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  info: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  slug: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
