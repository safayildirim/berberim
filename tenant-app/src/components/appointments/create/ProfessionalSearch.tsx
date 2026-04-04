import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, SIZES } from '@/src/constants/theme';

interface Props {
  search: string;
  onSearchChange: (text: string) => void;
}

export const ProfessionalSearch = ({ search, onSearchChange }: Props) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Search size={20} color={COLORS.outline} strokeWidth={2.5} />
        <TextInput
          style={styles.input}
          placeholder={t('appointmentCreate.professionalPlaceholder')}
          value={search}
          onChangeText={onSearchChange}
          placeholderTextColor={COLORS.outlineVariant}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerHigh,
    paddingHorizontal: SIZES.md,
    height: 60,
    borderRadius: SIZES.radius + 4,
    gap: SIZES.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.onSurface,
  },
});
