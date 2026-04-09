import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/store/useThemeStore';
import { getColors, SIZES } from '@/src/constants/theme';
import { Typography } from '@/src/components/ui';
import { Header } from './Header';

interface ScreenProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  scrollable?: boolean;
  loading?: boolean;
  error?: Error | null;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  headerTitle?: string;
  onHeaderBack?: () => void;
  showHeaderBack?: boolean;
  headerRightElement?: React.ReactNode;
  showProfile?: boolean;
  transparentStatusBar?: boolean;
  contentContainerStyle?: ViewStyle;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  style,
  scrollable = false,
  loading = false,
  error = null,
  empty = false,
  emptyTitle = 'No data found',
  emptyDescription = 'There is nothing to show at the moment.',
  headerTitle,
  onHeaderBack,
  showHeaderBack,
  headerRightElement,
  showProfile,
  transparentStatusBar = false,
  contentContainerStyle,
}) => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Typography
            variant="label"
            style={{ marginTop: SIZES.md, color: themeColors.secondary }}
          >
            {t('common.loading')}
          </Typography>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Typography variant="h3" color={themeColors.error}>
            {t('common.error')}
          </Typography>
          <Typography
            variant="body"
            style={{
              marginTop: SIZES.sm,
              textAlign: 'center',
              color: themeColors.secondary,
            }}
          >
            {error.message || t('common.unexpectedError')}
          </Typography>
        </View>
      );
    }

    if (empty) {
      return (
        <View style={styles.centerContainer}>
          <Typography variant="h3" color={themeColors.text}>
            {emptyTitle}
          </Typography>
          <Typography
            variant="body"
            style={{
              marginTop: SIZES.sm,
              textAlign: 'center',
              color: themeColors.secondary,
            }}
          >
            {emptyDescription}
          </Typography>
        </View>
      );
    }

    if (scrollable) {
      return (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        >
          {children}
        </ScrollView>
      );
    }

    return <View style={[styles.content, style]}>{children}</View>;
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <StatusBar
        barStyle={
          transparentStatusBar
            ? 'light-content'
            : isDark
              ? 'light-content'
              : 'dark-content'
        }
        backgroundColor={
          transparentStatusBar ? 'transparent' : themeColors.background
        }
        translucent={transparentStatusBar}
      />
      {headerTitle && (
        <Header
          title={headerTitle}
          onBack={onHeaderBack}
          showBack={
            showHeaderBack !== undefined ? showHeaderBack : !!onHeaderBack
          }
          rightElement={headerRightElement}
          showProfile={showProfile}
        />
      )}
      <View style={{ flex: 1 }}>{renderContent()}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.padding * 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding,
  },
});
