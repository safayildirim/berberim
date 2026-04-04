import { useRouter } from 'expo-router';
import { Scissors } from 'lucide-react-native';
import React from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../../src/components/common/Screen';
import { CatalogCategoryTabs } from '../../src/components/services/catalog/CatalogCategoryTabs';
import { CatalogServiceCard } from '../../src/components/services/catalog/CatalogServiceCard';
import { CatalogStatsHUD } from '../../src/components/services/catalog/CatalogStatsHUD';
import { CatalogTopBar } from '../../src/components/services/catalog/CatalogTopBar';
import { useServiceCatalog } from '../../src/hooks/services/useServiceCatalog';

export default function ServicesListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { services, stats, categories, activeCategory, setActiveCategory } =
    useServiceCatalog();

  return (
    <Screen style={styles.container} withPadding={false} transparentStatusBar>
      <View style={{ paddingTop: insets.top }}>
        <CatalogTopBar />
      </View>

      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <CatalogStatsHUD total={stats.total} active={stats.active} />
            <CatalogCategoryTabs
              activeCategory={activeCategory}
              categories={categories}
              onSelect={setActiveCategory}
            />
          </>
        }
        renderItem={({ item }) => <CatalogServiceCard service={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={[styles.fab, { bottom: 24 + insets.bottom }]}
        onPress={() => router.push('/services/create' as any)}
        activeOpacity={0.9}
      >
        <Scissors size={28} color="#ffffff" />
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f7f9fb',
  },
  listContent: {
    paddingBottom: 120,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#051125',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#051125',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
