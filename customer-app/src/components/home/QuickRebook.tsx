import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { History, RotateCcw } from 'lucide-react-native';
import { useTheme } from '@/src/store/useThemeStore';
import { Typography } from '@/src/components/ui';
import { SIZES } from '@/src/constants/theme';
import { PastBooking } from '@/src/hooks/useHomeData';

interface QuickRebookProps {
  pastBooking: PastBooking;
}

export const QuickRebook = ({ pastBooking }: QuickRebookProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Typography
        variant="h3"
        style={[styles.sectionTitle, { color: colors.text }]}
      >
        {t('home.quickRebook')}
      </Typography>

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surfaceContainer,
            borderColor: colors.outlineVariant,
          },
        ]}
      >
        <View style={styles.info}>
          <Image
            source={{ uri: pastBooking.shopImage }}
            style={styles.shopImage}
          />
          <View style={styles.details}>
            <Typography style={[styles.shopName, { color: colors.text }]}>
              {pastBooking.shopName}
            </Typography>
            <Typography
              variant="caption"
              style={{ color: colors.onSurfaceVariant }}
            >
              {pastBooking.service} • {pastBooking.barberName}
            </Typography>
            <View style={styles.lastVisitRow}>
              <History size={10} color={colors.onSurfaceVariant} />
              <Typography
                variant="caption"
                style={[
                  styles.lastVisitText,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                {t('appointments.past')}: {pastBooking.lastVisit}
              </Typography>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.rebookButton,
            {
              backgroundColor: colors.card,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <RotateCcw size={18} color="#f59e0b" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SIZES.md,
    marginTop: SIZES.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  shopImage: {
    width: 56,
    height: 56,
    borderRadius: 16,
  },
  details: {
    flex: 1,
  },
  shopName: {
    fontSize: 14,
    fontWeight: '800',
  },
  lastVisitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  lastVisitText: {
    fontSize: 10,
  },
  rebookButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
});
