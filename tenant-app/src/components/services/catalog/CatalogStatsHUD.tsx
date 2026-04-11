import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { SHADOWS, TYPOGRAPHY } from '@/src/constants/theme';
import { useTheme } from '@/src/hooks/useTheme';

interface Props {
  total: number;
  active: number;
}

export const CatalogStatsHUD: React.FC<Props> = ({ total, active }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.hudWrapper}>
      <View
        style={[
          styles.hudContent,
          {
            backgroundColor: colors.surfaceContainerLow,
            borderLeftColor: colors.primary,
          },
        ]}
      >
        <View style={styles.statsRow}>
          <View>
            <Text style={[styles.label, { color: colors.secondary }]}>
              {t('serviceCatalog.totalServices').toUpperCase()}
            </Text>
            <Text style={[styles.value, { color: colors.primary }]}>
              {total}
            </Text>
          </View>
          <View
            style={[styles.divider, { backgroundColor: colors.border + '15' }]}
          />
          <View>
            <Text style={[styles.label, { color: colors.secondary }]}>
              {t('serviceCatalog.active').toUpperCase()}
            </Text>
            <Text style={[styles.value, { color: colors.primary }]}>
              {active}
            </Text>
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
    marginBottom: 8,
  },
  hudContent: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    ...SHADOWS.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 32,
    alignItems: 'center',
  },
  label: {
    ...TYPOGRAPHY.label,
    fontSize: 9,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  value: {
    ...TYPOGRAPHY.h2,
    fontSize: 24,
  },
  divider: {
    width: 1,
    height: 32,
  },
});
