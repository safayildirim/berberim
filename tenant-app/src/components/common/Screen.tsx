import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  ViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '@/src/constants/theme';
import { Header } from '@/src/components/common/Header';

interface ScreenProps extends ViewProps {
  children: React.ReactNode;
  scrollable?: boolean;
  withPadding?: boolean;
  backgroundColor?: string;
  transparentStatusBar?: boolean;
  headerTitle?: string;
  headerSubtitle?: string;
  showHeaderBack?: boolean;
  onHeaderBack?: () => void;
  leftElement?: React.ReactNode;
  headerRight?: React.ReactNode;
  showNotification?: boolean;
}

export const Screen = ({
  children,
  scrollable = false,
  withPadding = true,
  backgroundColor = COLORS.background,
  transparentStatusBar = false,
  headerTitle,
  headerSubtitle,
  showHeaderBack,
  onHeaderBack,
  leftElement,
  headerRight,
  showNotification,
  style,
  ...props
}: ScreenProps) => {
  const content = (
    <View
      style={[
        styles.content,
        withPadding && styles.containerPadding,
        style,
        transparentStatusBar && styles.transparentContent,
      ]}
      {...props}
    >
      {children}
    </View>
  );

  const container = (
    <SafeAreaView style={[styles.screen, { backgroundColor }]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={transparentStatusBar}
      />
      {headerTitle && (
        <Header
          title={headerTitle}
          subtitle={headerSubtitle}
          showBack={showHeaderBack}
          onBack={onHeaderBack}
          leftElement={leftElement}
          rightElement={headerRight}
          showNotification={showNotification}
        />
      )}
      {scrollable ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );

  return container;
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  transparentContent: {
    paddingTop: 0,
  },
  scrollContent: {
    flexGrow: 1,
  },
  containerPadding: {
    paddingHorizontal: SIZES.padding,
  },
});
