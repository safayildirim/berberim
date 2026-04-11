import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { TYPOGRAPHY } from '@/src/constants/theme';
import { useTheme } from '@/src/hooks/useTheme';

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
  const { colors } = useTheme();

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
        {categories.map((catId) => {
          const isActive = activeCategory === catId;
          return (
            <TouchableOpacity
              key={catId}
              style={[
                styles.tab,
                {
                  backgroundColor: isActive
                    ? colors.primary
                    : colors.surfaceContainerLow,
                },
              ]}
              onPress={() => onSelect(catId)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isActive ? colors.onPrimary : colors.secondary },
                ]}
              >
                {getLabel(catId)}
              </Text>
            </TouchableOpacity>
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
    gap: 12,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
  },
  tabText: {
    ...TYPOGRAPHY.label,
    fontSize: 13,
  },
});
