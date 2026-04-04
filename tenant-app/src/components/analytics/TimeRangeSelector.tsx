import { useTranslation } from 'react-i18next';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { COLORS, TYPOGRAPHY, SIZES, SHADOWS } from '@/src/constants/theme';
import { TimeRange } from '@/src/hooks/analytics/useAnalytics';

interface TimeRangeSelectorProps {
  currentRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
}

export const TimeRangeSelector = ({
  currentRange,
  onRangeChange,
}: TimeRangeSelectorProps) => {
  const { t } = useTranslation();
  const options: TimeRange[] = ['daily', 'weekly', 'monthly'];

  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isActive = currentRange === option;
        return (
          <TouchableOpacity
            key={option}
            onPress={() => onRangeChange(option)}
            style={[styles.tab, isActive && styles.activeTab, SHADOWS.sm]}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
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
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 14,
    padding: 4,
    marginHorizontal: SIZES.md,
    marginTop: SIZES.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: SIZES.sm,
    alignItems: 'center',
    borderRadius: 10,
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: COLORS.white,
  },
  tabText: {
    ...TYPOGRAPHY.label,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '800',
  },
});
