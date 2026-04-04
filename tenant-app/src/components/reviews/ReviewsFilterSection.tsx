import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { COLORS, TYPOGRAPHY } from '@/src/constants/theme';
import { useTranslation } from 'react-i18next';

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

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {FILTERS.map((filter) => (
          <Pressable
            key={filter.id}
            onPress={() => onFilterChange(filter.id)}
            style={[
              styles.filterButton,
              currentFilter === filter.id && styles.activeButton,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                currentFilter === filter.id && styles.activeText,
              ]}
            >
              {t(`reviews.filters.${filter.id}`, filter.label)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  activeButton: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.onSurface,
    fontSize: 12,
  },
  activeText: {
    color: COLORS.onPrimary,
  },
});
