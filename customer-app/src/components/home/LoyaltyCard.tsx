import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Award, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/src/store/useThemeStore';
import { Typography } from '@/src/components/ui';
import { SIZES } from '@/src/constants/theme';
import { LoyaltyData } from '@/src/hooks/useHomeData';

interface LoyaltyCardProps {
  data: LoyaltyData;
}

export const LoyaltyCard = ({ data }: LoyaltyCardProps) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const progress = (data.points / data.pointsNeeded) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography
          variant="h3"
          style={[styles.sectionTitle, { color: colors.text }]}
        >
          {t('loyalty.title')}
        </Typography>
        <TouchableOpacity style={styles.detailsLink}>
          <Typography style={styles.detailsText}>
            {t('common.details')}
          </Typography>
          <ChevronRight size={14} color="#f59e0b" />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surfaceContainer,
            borderColor: isDark
              ? 'rgba(245, 158, 11, 0.2)'
              : colors.outlineVariant,
          },
        ]}
      >
        <View style={styles.loyaltInfo}>
          <View style={styles.mainInfo}>
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: isDark
                    ? 'rgba(245, 158, 11, 0.1)'
                    : 'rgba(245, 158, 11, 0.05)',
                  borderColor: isDark
                    ? 'rgba(245, 158, 11, 0.2)'
                    : colors.outlineVariant,
                },
              ]}
            >
              <Award size={22} color="#f59e0b" />
            </View>
            <View>
              <Typography variant="caption" style={styles.tierText}>
                {data.tier}
              </Typography>
              <Typography style={[styles.pointsText, { color: colors.text }]}>
                {data.points.toLocaleString()}{' '}
                <Typography
                  variant="caption"
                  style={{ color: colors.onSurfaceVariant }}
                >
                  {t('loyalty.pointsLabel_plural')}
                </Typography>
              </Typography>
            </View>
          </View>
          <TouchableOpacity style={styles.redeemButton}>
            <Typography style={styles.redeemText}>
              {t('loyalty.redeemNow')}
            </Typography>
          </TouchableOpacity>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <Typography
              variant="caption"
              style={{ color: colors.onSurfaceVariant }}
            >
              {t('loyalty.nextReward')}: {data.nextReward}
            </Typography>
            <Typography variant="caption" style={styles.progressValue}>
              {data.points} / {data.pointsNeeded}
            </Typography>
          </View>
          <View
            style={[
              styles.progressBarContainer,
              { backgroundColor: colors.outlineVariant },
            ]}
          >
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SIZES.md,
    marginTop: SIZES.sm,
    paddingBottom: SIZES.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  detailsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailsText: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
  },
  loyaltInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f59e0b',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pointsText: {
    fontSize: 20,
    fontWeight: '800',
  },
  redeemButton: {
    backgroundColor: '#27272a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  redeemText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
  },
  progressSection: {
    gap: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressValue: {
    color: '#f59e0b',
    fontWeight: '700',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 4,
  },
});
