import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '@/src/constants/theme';

interface Props {
  activeCategory: string;
  categories: string[];
  onSelect: (category: string) => void;
}

export const CatalogCategoryTabs: React.FC<Props> = ({
  activeCategory,
  categories,
  onSelect,
}) => {
  const { t } = useTranslation();

  const getLabel = (id: string) => {
    switch (id) {
      case 'all':
        return t('serviceCatalog.categories.all');
      case 'haircuts':
        return t('serviceCatalog.categories.haircuts');
      case 'shaves':
        return t('serviceCatalog.categories.shaves');
      case 'treatments':
        return t('serviceCatalog.categories.treatments');
      case 'addons':
        return t('serviceCatalog.categories.addons');
      default:
        // Capitalize dynamic categories
        return id.charAt(0).toUpperCase() + id.slice(1);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((catId) => (
          <TouchableOpacity
            key={catId}
            style={[styles.tab, activeCategory === catId && styles.activeTab]}
            onPress={() => onSelect(catId)}
          >
            <Text
              style={[
                styles.tabText,
                activeCategory === catId && styles.activeTabText,
              ]}
            >
              {getLabel(catId)}
            </Text>
          </TouchableOpacity>
        ))}
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
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: '#eceef0',
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  activeTabText: {
    color: COLORS.white,
    fontWeight: '700',
  },
});
