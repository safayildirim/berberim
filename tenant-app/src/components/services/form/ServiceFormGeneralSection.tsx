import { ChevronDown, FileText } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS } from '@/src/constants/theme';

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

  return (
    <View style={styles.section}>
      <View style={styles.sectionLabelRow}>
        <FileText size={14} color={COLORS.secondary} />
        <Text style={styles.sectionLabel}>{t('serviceForm.generalInfo')}</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('serviceForm.serviceName')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('serviceForm.placeholders.name')}
          value={name}
          onChangeText={(v) => onUpdate('name', v)}
          placeholderTextColor="#c5c6cd"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('serviceForm.category')}</Text>
        <View style={styles.pickerWrapper}>
          <TextInput
            style={styles.input}
            value={category}
            onChangeText={(v) => onUpdate('category', v)}
            placeholderTextColor="#c5c6cd"
          />
          <ChevronDown
            size={20}
            color={COLORS.secondary}
            style={styles.pickerIcon}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('serviceForm.description')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={t('serviceForm.placeholders.description')}
          multiline
          numberOfLines={3}
          value={description}
          onChangeText={(v) => onUpdate('description', v)}
          placeholderTextColor="#c5c6cd"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#ffffff',
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
    color: COLORS.secondary,
    letterSpacing: 1.5,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: 1,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#eceef0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    fontWeight: '600',
    color: '#051125',
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
