import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/src/constants/theme';

interface Props {
  activeChairs?: number;
}

export const DashboardOperationalHeader: React.FC<Props> = ({
  activeChairs = 4,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.headerSection}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>{t('dashboard.today')}</Text>
        <View style={styles.activeStatus}>
          <View style={styles.pulseDot} />
          <Text style={styles.activeStatusText}>
            {t('dashboard.chairsActive', { count: activeChairs })}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerSection: {
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  activeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 8,
  },
  activeStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.onSecondaryFixedVariant,
  },
});
