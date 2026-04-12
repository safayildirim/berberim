import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';

interface Props {
  isActive: boolean;
  onUpdate: (isActive: boolean) => void;
}

export const ServiceFormStatusSection: React.FC<Props> = ({
  isActive,
  onUpdate,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View
      style={[styles.section, { backgroundColor: colors.surfaceContainerLow }]}
    >
      <View style={styles.infoCol}>
        <Text style={[styles.title, { color: colors.primary }]}>
          {t('serviceForm.activeStatus')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.secondary }]}>
          {t('serviceForm.activeStatusSub')}
        </Text>
      </View>
      <Switch
        value={isActive}
        onValueChange={onUpdate}
        trackColor={{
          false: colors.surfaceContainerHigh,
          true: colors.primary,
        }}
        thumbColor="#ffffff"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
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
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
  },
});
