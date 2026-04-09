import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { useTheme } from '@/src/store/useThemeStore';
import { SIZES } from '@/src/constants/theme';

export const HomeSearch = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: colors.surfaceContainer,
            borderColor: colors.outlineVariant,
          },
        ]}
      >
        <Search size={18} color={colors.onSurfaceVariant} />
        <TextInput
          placeholder={t('common.searchPlaceholder')}
          placeholderTextColor={colors.onSurfaceVariant}
          style={[styles.input, { color: colors.text }]}
        />
      </View>
      <TouchableOpacity style={styles.filterButton}>
        <SlidersHorizontal size={18} color="#000" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: SIZES.md,
    marginTop: SIZES.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  filterButton: {
    backgroundColor: '#f59e0b',
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
