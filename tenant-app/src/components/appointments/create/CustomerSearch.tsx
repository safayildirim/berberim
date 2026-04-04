import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { Search, UserPlus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, TYPOGRAPHY, SIZES } from '@/src/constants/theme';

interface Props {
  search: string;
  onSearchChange: (text: string) => void;
  onQuickAdd: () => void;
}

export const CustomerSearch = ({
  search,
  onSearchChange,
  onQuickAdd,
}: Props) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Search size={22} color={COLORS.outline} strokeWidth={2.5} />
        <TextInput
          style={styles.input}
          placeholder={t('appointmentCreate.searchPlaceholder')}
          value={search}
          onChangeText={onSearchChange}
          placeholderTextColor={COLORS.outline}
        />
      </View>

      <TouchableOpacity
        style={styles.quickAddBtn}
        onPress={onQuickAdd}
        activeOpacity={0.7}
      >
        <UserPlus size={20} color={COLORS.primary} strokeWidth={2.5} />
        <Text style={styles.quickAddText}>
          {t('appointmentCreate.addQuickCustomer')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.lg,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: SIZES.radius + 4,
    paddingHorizontal: SIZES.md,
    height: 60, // Premium tall feel
    gap: SIZES.sm,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.subtitle, // Taller font size for search
    color: COLORS.onSurface,
  },
  quickAddBtn: {
    marginTop: SIZES.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.sm,
    paddingVertical: SIZES.md,
    borderWidth: 2,
    borderColor: COLORS.outlineVariant,
    borderStyle: 'dashed',
    borderRadius: SIZES.radius + 8,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  quickAddText: {
    ...TYPOGRAPHY.bodyBold,
    color: COLORS.primary,
  },
});
