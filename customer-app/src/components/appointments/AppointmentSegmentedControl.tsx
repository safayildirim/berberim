import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';

interface AppointmentSegmentedControlProps {
  activeTab: 'upcoming' | 'past';
  onTabChange: (tab: 'upcoming' | 'past') => void;
  upcomingLabel: string;
  pastLabel: string;
}

export const AppointmentSegmentedControl = ({
  activeTab,
  onTabChange,
  upcomingLabel,
  pastLabel,
}: AppointmentSegmentedControlProps) => {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.surfaceContainerLow : '#f4f4f5',
          borderColor: colors.outlineVariant,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onTabChange('upcoming')}
        style={[
          styles.tab,
          activeTab === 'upcoming' && {
            backgroundColor: isDark ? colors.surfaceVariant : colors.card,
            borderColor: isDark ? colors.outline : '#e4e4e7',
          },
        ]}
      >
        <Typography
          variant="label"
          style={[
            styles.tabText,
            {
              color:
                activeTab === 'upcoming'
                  ? colors.text
                  : colors.onSurfaceVariant,
            },
          ]}
        >
          {upcomingLabel}
        </Typography>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onTabChange('past')}
        style={[
          styles.tab,
          activeTab === 'past' && {
            backgroundColor: isDark ? colors.surfaceVariant : colors.card,
            borderColor: isDark ? colors.outline : '#e4e4e7',
          },
        ]}
      >
        <Typography
          variant="label"
          style={[
            styles.tabText,
            {
              color:
                activeTab === 'past' ? colors.text : colors.onSurfaceVariant,
            },
          ]}
        >
          {pastLabel}
        </Typography>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
