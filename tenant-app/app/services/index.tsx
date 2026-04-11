import { useRouter } from 'expo-router';
import { Scissors } from 'lucide-react-native';
import React from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/src/components/common/Screen';
import { CatalogCategoryTabs } from '@/src/components/services/catalog/CatalogCategoryTabs';
import { CatalogServiceCard } from '@/src/components/services/catalog/CatalogServiceCard';
import { CatalogStatsHUD } from '@/src/components/services/catalog/CatalogStatsHUD';
import { useServiceCatalog } from '@/src/hooks/services/useServiceCatalog';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/src/hooks/useTheme';
import { SHADOWS } from '@/src/constants/theme';

export default function ServicesListScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { services, stats, categories, activeCategory, setActiveCategory } =
    useServiceCatalog();

  return (
    <Screen
      style={[styles.container, { backgroundColor: colors.background }]}
      withPadding={false}
      transparentStatusBar
      headerTitle={t('settings.items.services')}
      showHeaderBack={true}
    >
      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <CatalogStatsHUD total={stats.total} active={stats.active} />
            <CatalogCategoryTabs
              activeCategory={activeCategory}
              categories={categories}
              onSelect={setActiveCategory}
            />
          </View>
        }
        renderItem={({ item }) => <CatalogServiceCard service={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={[
          styles.fab,
          {
            bottom: 24 + insets.bottom,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
          },
        ]}
        onPress={() => router.push('/services/create' as any)}
        activeOpacity={0.9}
      >
        <Scissors size={28} color={colors.onPrimary} />
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 120,
  },
  fab: {
    position: 'absolute',
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
    elevation: 8,
  },
});
