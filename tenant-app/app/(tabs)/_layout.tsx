import { useTranslation } from 'react-i18next';
import { Tabs } from 'expo-router';
import {
  CalendarDays,
  LayoutDashboard,
  Menu,
  Star,
  Users,
} from 'lucide-react-native';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { COLORS, SHADOWS, TYPOGRAPHY } from '@/src/constants/theme';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.primaryDim,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIconStyle: styles.tabBarIcon,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('nav.dashboard'),
          tabBarIcon: ({ color, focused }) => (
            <LayoutDashboard
              size={24}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t('nav.calendar'),
          tabBarIcon: ({ color, focused }) => (
            <CalendarDays
              size={24}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: t('nav.customers'),
          tabBarIcon: ({ color, focused }) => (
            <Users size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="reviews"
        options={{
          title: t('nav.reviews'),
          tabBarIcon: ({ color, focused }) => (
            <Star size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t('nav.more'),
          tabBarIcon: ({ color, focused }) => (
            <Menu size={24} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white + 'F0', // Slight transparency for glass effect
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceContainerHighest + '40',
    height: Platform.OS === 'ios' ? 96 : 72,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    position: 'absolute', // Make it float to show rounded corners better
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    paddingTop: 12,
    ...SHADOWS.lg,
    shadowOpacity: 0.08,
  },
  tabBarLabel: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  tabBarIcon: {
    marginBottom: 0,
  },
});
