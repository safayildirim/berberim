import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { COLORS } from '@/src/constants/theme';

interface Props {
  isActive: boolean;
  onUpdate: (isActive: boolean) => void;
}

export const ServiceFormStatusSection: React.FC<Props> = ({
  isActive,
  onUpdate,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <View style={styles.infoCol}>
        <Text style={styles.title}>{t('serviceForm.activeStatus')}</Text>
        <Text style={styles.subtitle}>{t('serviceForm.activeStatusSub')}</Text>
      </View>
      <Switch
        value={isActive}
        onValueChange={onUpdate}
        trackColor={{ false: '#e0e3e5', true: '#051125' }}
        thumbColor="#ffffff"
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  infoCol: {
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#051125',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.secondary,
  },
});
