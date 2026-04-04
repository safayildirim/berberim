import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  isEdit?: boolean;
  onBack: () => void;
}

export const ServiceFormHeader: React.FC<Props> = ({ isEdit, onBack }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.topBar, { paddingTop: insets.top }]}>
      <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
        <ArrowLeft size={24} color="#051125" />
      </TouchableOpacity>
      <Text style={styles.topBarTitle}>
        {isEdit ? t('serviceForm.editTitle') : t('serviceForm.addTitle')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(247, 249, 251, 0.8)',
  },
  iconBtn: {
    padding: 8,
    marginRight: 16,
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#051125',
    letterSpacing: -0.5,
  },
});
