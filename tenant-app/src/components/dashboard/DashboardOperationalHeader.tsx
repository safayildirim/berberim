import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { TYPOGRAPHY } from '@/src/constants/theme';

interface Props {
  activeChairs?: number;
}

export const DashboardOperationalHeader: React.FC<Props> = ({
  activeChairs = 4,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.headerSection}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>
          {t('dashboard.today')}
        </Text>
        <View
          style={[
            styles.activeStatus,
            { backgroundColor: colors.surfaceContainerHigh },
          ]}
        >
          <View
            style={[styles.pulseDot, { backgroundColor: colors.success }]}
          />
          <Text style={[styles.activeStatusText, { color: colors.secondary }]}>
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
    ...TYPOGRAPHY.h1,
    fontSize: 32,
    letterSpacing: -1,
  },
  activeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  activeStatusText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
  },
});
