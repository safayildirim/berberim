import { useRouter } from 'expo-router';
import { Award, Clock } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SHADOWS, TYPOGRAPHY } from '@/src/constants/theme';
import { Service } from '@/src/types';
import { useTheme } from '@/src/hooks/useTheme';

interface Props {
  service: Service;
}

export const CatalogServiceCard: React.FC<Props> = ({ service }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();

  const priceNum = parseFloat(service.base_price) || 0;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderLeftColor: service.is_active
            ? colors.success
            : colors.secondary,
        },
        !service.is_active && { opacity: 0.7 },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.infoCol}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.serviceName,
                { color: colors.primary },
                !service.is_active && { color: colors.secondary },
              ]}
              numberOfLines={1}
            >
              {service.name}
            </Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: service.is_active
                    ? colors.success + '15'
                    : colors.surfaceContainerHigh,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color: service.is_active
                      ? colors.success
                      : colors.secondary,
                  },
                ]}
              >
                {service.is_active
                  ? t('serviceCatalog.active').toUpperCase()
                  : t('serviceCatalog.inactive').toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={14} color={colors.secondary} />
              <Text style={[styles.metaText, { color: colors.secondary }]}>
                {service.duration_minutes} {t('serviceCatalog.minutes')}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Award size={14} color={colors.secondary} />
              <Text style={[styles.metaText, { color: colors.secondary }]}>
                {service.points_reward} {t('serviceCatalog.points')}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[styles.priceCol, { borderTopColor: colors.border + '10' }]}
        >
          <View style={styles.priceInfo}>
            <Text style={[styles.priceLabel, { color: colors.secondary }]}>
              {t('serviceCatalog.price').toUpperCase()}
            </Text>
            <Text
              style={[
                styles.priceValue,
                { color: colors.primary },
                !service.is_active && { color: colors.secondary },
              ]}
            >
              {priceNum.toFixed(2)} ₺
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.manageBtn,
              { backgroundColor: colors.surfaceContainerHigh },
            ]}
            onPress={() => router.push(`/services/${service.id}` as any)}
          >
            <Text
              style={[
                styles.manageText,
                { color: colors.primary },
                !service.is_active && { color: colors.secondary },
              ]}
            >
              {t('serviceCatalog.manage')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    marginHorizontal: 24,
    borderLeftWidth: 4,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'column',
    gap: 16,
  },
  infoCol: {
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceName: {
    ...TYPOGRAPHY.h3,
    fontSize: 18,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    ...TYPOGRAPHY.label,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 12,
  },
  priceCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  priceInfo: {
    alignItems: 'flex-start',
  },
  priceLabel: {
    ...TYPOGRAPHY.label,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  priceValue: {
    ...TYPOGRAPHY.h2,
    fontSize: 22,
    marginTop: 2,
  },
  manageBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  manageText: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 14,
  },
});
