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
import { COLORS, SIZES } from '@/src/constants/theme';
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
  transparentStatusBar = false,
  contentContainerStyle,
}) => {
  const { t } = useTranslation();

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Typography
            variant="label"
            color={COLORS.secondary}
            style={{ marginTop: SIZES.md }}
          >
            {t('common.loading')}
          </Typography>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Typography variant="h3" color={COLORS.error}>
            {t('common.error')}
          </Typography>
          <Typography
            variant="body"
            color={COLORS.secondary}
            style={{ marginTop: SIZES.sm, textAlign: 'center' }}
          >
            {error.message || t('common.unexpectedError')}
          </Typography>
        </View>
      );
    }

    if (empty) {
      return (
        <View style={styles.centerContainer}>
          <Typography variant="h3">{emptyTitle}</Typography>
          <Typography
            variant="body"
            color={COLORS.secondary}
            style={{ marginTop: SIZES.sm, textAlign: 'center' }}
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
      style={[styles.container, { backgroundColor: COLORS.background }]}
    >
      <StatusBar
        barStyle={transparentStatusBar ? 'light-content' : 'dark-content'}
        backgroundColor={
          transparentStatusBar ? 'transparent' : COLORS.background
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
