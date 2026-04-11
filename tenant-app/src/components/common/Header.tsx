import { useRouter } from 'expo-router';
import { ChevronLeft, Bell } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { SIZES } from '@/src/constants/theme';
import { useTheme } from '@/src/hooks/useTheme';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  showNotification?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  leftElement,
  rightElement,
  showNotification = false,
}) => {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderBottomColor: isDark
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(0,0,0,0.05)',
        },
      ]}
    >
      <View style={styles.leftContainer}>
        {leftElement ? (
          leftElement
        ) : showBack ? (
          <TouchableOpacity
            style={[
              styles.backButton,
              { backgroundColor: colors.surfaceContainerLow },
            ]}
            onPress={handleBack}
          >
            <ChevronLeft size={24} color={colors.primary} strokeWidth={2.5} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.centerContainer}>
        {title && (
          <View style={styles.titleContainer}>
            <Text
              style={[styles.title, { color: colors.primary }]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                style={[styles.subtitle, { color: colors.secondary }]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.rightContainer}>
        {rightElement ? (
          rightElement
        ) : showNotification ? (
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={22} color={colors.primary} strokeWidth={2} />
            <View
              style={[
                styles.notificationDot,
                { borderColor: colors.background },
              ]}
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
    height: 48,
    borderBottomWidth: 1,
  },
  leftContainer: {
    width: 44,
  },
  centerContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  rightContainer: {
    width: 44,
    alignItems: 'flex-end',
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: -2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ba1a1a', // Keep error red or use colors.error
    borderWidth: 1.5,
  },
});
