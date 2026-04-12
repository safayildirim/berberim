import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import {
  Calendar,
  CheckCircle,
  UserMinus,
  Banknote,
} from 'lucide-react-native';
import { SHADOWS, TYPOGRAPHY, SIZES } from '@/src/constants/theme';
import { useTheme } from '@/src/hooks/useTheme';

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  icon: (color: string) => React.ReactNode;
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
}: MetricCardProps) => {
  const { colors } = useTheme();
  const isNegative = change?.startsWith('-');

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card },
        SHADOWS.sm,
        borderLeft && {
          borderLeftWidth: 4,
          borderLeftColor: borderLeftColor || colors.primary,
        },
        !borderLeft && {
          borderColor: colors.outlineVariant + '15',
          borderWidth: 1,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        {icon(colors.primary)}
        {change && (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: isNegative
                  ? colors.error + '15'
                  : colors.success + '15',
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: isNegative ? colors.error : colors.success },
              ]}
            >
              {change}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.cardLabel, { color: colors.secondary }]}>
          {label.toUpperCase()}
        </Text>
        <Text style={[styles.cardValue, { color: colors.primary }]}>
          {value}
        </Text>
      </View>
    </View>
  );
};

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
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <MetricCard
        label={t('analytics.metrics.totalAppointments')}
        value={metrics.totalAppointments.toLocaleString()}
        change={metrics.appointmentsChange}
        icon={(color) => <Calendar size={20} color={color} strokeWidth={2.5} />}
      />
      <MetricCard
        label={t('analytics.metrics.revenue')}
        value={`${Number(metrics.revenue).toLocaleString()} ₺`}
        icon={(color) => <Banknote size={20} color={color} strokeWidth={2.5} />}
      />
      <MetricCard
        label={t('analytics.metrics.noShowRate')}
        value={metrics.noShowRate}
        change={metrics.noShowRateChange}
        borderLeftColor={colors.error}
        icon={(color) => (
          <UserMinus size={20} color={color} strokeWidth={2.5} />
        )}
        borderLeft
      />
      <MetricCard
        label={t('analytics.metrics.completed')}
        value={metrics.completed.toLocaleString()}
        icon={(color) => (
          <CheckCircle size={20} color={color} strokeWidth={2.5} />
        )}
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
    padding: 16,
    borderRadius: 20,
    gap: 20,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    ...TYPOGRAPHY.label,
    fontWeight: '900',
    fontSize: 10,
  },
  cardBody: {
    gap: 2,
  },
  cardLabel: {
    ...TYPOGRAPHY.label,
    fontWeight: '800',
    letterSpacing: 1,
    fontSize: 9,
  },
  cardValue: {
    ...TYPOGRAPHY.h2,
    fontSize: 24,
    fontWeight: '900',
  },
});
