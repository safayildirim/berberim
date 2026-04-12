import { useTranslation } from 'react-i18next';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SHADOWS, TYPOGRAPHY, SIZES } from '@/src/constants/theme';
import { TimeRange } from '@/src/hooks/analytics/useAnalytics';
import { useTheme } from '@/src/hooks/useTheme';

interface TimeRangeSelectorProps {
  currentRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
}

export const TimeRangeSelector = ({
  currentRange,
  onRangeChange,
}: TimeRangeSelectorProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const options: TimeRange[] = ['daily', 'weekly', 'monthly'];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surfaceContainerLow },
      ]}
    >
      {options.map((option) => {
        const isActive = currentRange === option;
        return (
          <TouchableOpacity
            key={option}
            onPress={() => onRangeChange(option)}
            style={[
              styles.tab,
              isActive && { backgroundColor: colors.card, ...SHADOWS.sm },
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                { color: isActive ? colors.primary : colors.secondary },
                isActive && { fontWeight: '800' },
              ]}
            >
              {t(`analytics.timeRanges.${option}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 6,
    marginHorizontal: SIZES.md,
    marginTop: SIZES.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    justifyContent: 'center',
  },
  tabText: {
    ...TYPOGRAPHY.label,
    fontWeight: '600',
  },
});
