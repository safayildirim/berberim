import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { TYPOGRAPHY } from '@/src/constants/theme';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/src/hooks/useTheme';

interface ReviewsFilterSectionProps {
  currentFilter: 'all' | '5' | '4' | 'recent';
  onFilterChange: (filter: 'all' | '5' | '4' | 'recent') => void;
}

const FILTERS = [
  { id: 'all', label: 'All Reviews' },
  { id: '5', label: '5 Stars' },
  { id: '4', label: '4 Stars' },
  { id: 'recent', label: 'Recent' },
] as const;

export const ReviewsFilterSection: React.FC<ReviewsFilterSectionProps> = ({
  currentFilter,
  onFilterChange,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {FILTERS.map((filter) => {
          const isActive = currentFilter === filter.id;
          return (
            <Pressable
              key={filter.id}
              onPress={() => onFilterChange(filter.id)}
              style={[
                styles.filterButton,
                {
                  backgroundColor: isActive
                    ? colors.primary
                    : colors.surfaceContainerHigh,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: isActive ? colors.onPrimary : colors.secondary,
                  },
                ]}
              >
                {t(`reviews.filters.${filter.id}`, filter.label)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
  },
  filterText: {
    ...TYPOGRAPHY.label,
    fontSize: 12,
    fontWeight: '700',
  },
});
