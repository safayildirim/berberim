import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SIZES } from '@/src/constants/theme';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  showProfile?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = true,
  onBack,
  leftElement,
  rightElement,
  showProfile = true,
}) => {
  const router = useRouter();
  const { colors } = useTheme();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.leftContainer}>
        {leftElement ? (
          leftElement
        ) : showBack ? (
          <TouchableOpacity
            style={[
              styles.backButton,
              { backgroundColor: colors.surfaceContainer },
            ]}
            onPress={handleBack}
          >
            <ArrowLeft size={24} color={colors.text} pointerEvents="none" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.centerContainer}>
        {title && (
          <Typography variant="h3" style={styles.title}>
            {title}
          </Typography>
        )}
      </View>

      <View style={styles.rightContainer}>
        {rightElement ? (
          rightElement
        ) : showProfile ? (
          <TouchableOpacity
            style={[
              styles.profileButton,
              { borderColor: colors.surfaceContainer },
            ]}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
              }}
              style={styles.topProfileAvatar}
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.md,
  },
  leftContainer: {
    width: 44,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  rightContainer: {
    width: 44,
    alignItems: 'flex-end',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    overflow: 'hidden',
  },
  topProfileAvatar: {
    width: '100%',
    height: '100%',
  },
});
