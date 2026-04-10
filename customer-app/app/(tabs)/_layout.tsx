import { Tabs } from 'expo-router';
import { Calendar, Home, Trophy, User } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/src/store/useThemeStore';

export default function TabLayout() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  const renderTabIcon = (
    Icon: any,
    label: string,
    color: string,
    focused: boolean,
  ) => (
    <View
      pointerEvents="none"
      style={[styles.itemContainer, focused && styles.activeItemContainer]}
    >
      <Icon color={color} size={22} strokeWidth={focused ? 2.5 : 2} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: isDark
          ? colors.onSurfaceVariant
          : colors.secondary,
        tabBarShowLabel: false,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
        ],
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon(Home, t('nav.home'), color, focused),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon(Calendar, t('nav.appointments'), color, focused),
        }}
      />
      <Tabs.Screen
        name="loyalty"
        options={{
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon(Trophy, t('nav.loyalty'), color, focused),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon(User, t('nav.profile'), color, focused),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === 'ios' ? 98 : 80,
    borderTopWidth: 1,
    paddingHorizontal: 8,
  },
  itemContainer: {
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 40,
    minWidth: 80,
  },
  activeItemContainer: {
    // Background color is handled dynamically in renderTabIcon
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
