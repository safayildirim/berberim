import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, SHADOWS } from '@/src/constants/theme';

interface Props {
  total: number;
  active: number;
}

export const CatalogStatsHUD: React.FC<Props> = ({ total, active }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.hudWrapper}>
      <View style={styles.hudContent}>
        <View style={styles.statsRow}>
          <View>
            <Text style={styles.label}>
              {t('serviceCatalog.totalServices')}
            </Text>
            <Text style={styles.value}>{total}</Text>
          </View>
          <View style={styles.divider} />
          <View>
            <Text style={styles.label}>{t('serviceCatalog.active')}</Text>
            <Text style={styles.value}>{active}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hudWrapper: {
    paddingHorizontal: 24,
    paddingTop: 24,
    marginBottom: 16,
  },
  hudContent: {
    backgroundColor: 'rgba(247, 249, 251, 0.8)',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.secondary,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
});
