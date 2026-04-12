import { ChevronDown, FileText } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';

interface Props {
  name: string;
  category: string;
  description: string;
  onUpdate: (field: any, value: any) => void;
}

export const ServiceFormGeneralSection: React.FC<Props> = ({
  name,
  category,
  description,
  onUpdate,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View
      style={[styles.section, { backgroundColor: colors.surfaceContainerLow }]}
    >
      <View style={styles.sectionLabelRow}>
        <FileText size={14} color={colors.secondary} />
        <Text style={[styles.sectionLabel, { color: colors.secondary }]}>
          {t('serviceForm.generalInfo')}
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.secondary }]}>
          {t('serviceForm.serviceName')}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceContainerHigh,
              color: colors.primary,
            },
          ]}
          placeholder={t('serviceForm.placeholders.name')}
          value={name}
          onChangeText={(v) => onUpdate('name', v)}
          placeholderTextColor={colors.outline + '80'}
          selectionColor={colors.primary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.secondary }]}>
          {t('serviceForm.category')}
        </Text>
        <View style={styles.pickerWrapper}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceContainerHigh,
                color: colors.primary,
              },
            ]}
            value={category}
            onChangeText={(v) => onUpdate('category', v)}
            placeholderTextColor={colors.outline + '80'}
            selectionColor={colors.primary}
          />
          <ChevronDown
            size={20}
            color={colors.secondary}
            style={styles.pickerIcon}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.secondary }]}>
          {t('serviceForm.description')}
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            {
              backgroundColor: colors.surfaceContainerHigh,
              color: colors.primary,
            },
          ]}
          placeholder={t('serviceForm.placeholders.description')}
          multiline
          numberOfLines={3}
          value={description}
          onChangeText={(v) => onUpdate('description', v)}
          placeholderTextColor={colors.outline + '80'}
          selectionColor={colors.primary}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
    gap: 20,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: -5,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginLeft: 4,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(197, 198, 205, 0.15)',
  },
  pickerWrapper: {
    position: 'relative',
  },
  pickerIcon: {
    position: 'absolute',
    right: 12,
    top: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
});
