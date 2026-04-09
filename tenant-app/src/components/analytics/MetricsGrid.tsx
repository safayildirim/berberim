import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import {
  Calendar,
  CheckCircle,
  UserMinus,
  Banknote,
} from 'lucide-react-native';
import { COLORS, TYPOGRAPHY, SIZES, SHADOWS } from '@/src/constants/theme';

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  borderLeft?: boolean;
  borderLeftColor?: string;
}

const MetricCard = ({
  label,
  value,
  change,
  icon,
  borderLeft,
  borderLeftColor,
}: MetricCardProps) => (
  <View
    style={[
      styles.card,
      SHADOWS.sm,
      borderLeft && {
        borderLeftWidth: 4,
        borderLeftColor: borderLeftColor || COLORS.tertiary,
      },
      !borderLeft && styles.cardBorder,
    ]}
  >
    <View style={styles.cardHeader}>
      {icon}
      {change && (
        <View
          style={[styles.badge, change.startsWith('-') && styles.badgeNegative]}
        >
          <Text
            style={[
              styles.badgeText,
              change.startsWith('-') && styles.badgeTextNegative,
            ]}
          >
            {change}
          </Text>
        </View>
      )}
    </View>
    <View style={styles.cardBody}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  </View>
);

interface MetricsGridProps {
  metrics: {
    totalAppointments: number;
    completed: number;
    cancelled: number;
    noShowRate: string;
    noShowRateChange: string;
    revenue: string;
    appointmentsChange: string;
  };
}

export const MetricsGrid = ({ metrics }: MetricsGridProps) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <MetricCard
        label={t('analytics.metrics.totalAppointments')}
        value={metrics.totalAppointments.toLocaleString()}
        change={metrics.appointmentsChange}
        icon={
          <Calendar size={20} color={COLORS.primaryDim} strokeWidth={2.5} />
        }
      />
      <MetricCard
        label={t('analytics.metrics.revenue')}
        value={`$${Number(metrics.revenue).toLocaleString()}`}
        icon={
          <Banknote size={20} color={COLORS.primaryDim} strokeWidth={2.5} />
        }
      />
      <MetricCard
        label={t('analytics.metrics.noShowRate')}
        value={metrics.noShowRate}
        change={metrics.noShowRateChange}
        icon={<UserMinus size={20} color={COLORS.tertiary} strokeWidth={2.5} />}
        borderLeft
      />
      <MetricCard
        label={t('analytics.metrics.completed')}
        value={metrics.completed.toLocaleString()}
        icon={
          <CheckCircle size={20} color={COLORS.primaryDim} strokeWidth={2.5} />
        }
      />
    </View>
  );
};

const { width } = Dimensions.get('window');
const cardWidth = (width - SIZES.md * 2 - SIZES.sm) / 2;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
    paddingHorizontal: SIZES.md,
    marginTop: SIZES.md,
  },
  card: {
    width: cardWidth,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 20,
    gap: 20,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  cardBorder: {
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + '10',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badge: {
    backgroundColor: '#ECFDF5', // emerald-50
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeNegative: {
    backgroundColor: '#FEF2F2', // red-50
  },
  badgeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '900',
    color: '#059669', // emerald-600
    fontSize: 10,
  },
  badgeTextNegative: {
    color: '#DC2626', // red-600
  },
  cardBody: {
    gap: 2,
  },
  cardLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 10,
  },
  cardValue: {
    ...TYPOGRAPHY.h2,
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.primary,
  },
});
