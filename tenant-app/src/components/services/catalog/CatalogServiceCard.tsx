import { useRouter } from 'expo-router';
import { Award, Clock } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SHADOWS } from '@/src/constants/theme';
import { Service } from '@/src/types';

interface Props {
  service: Service;
}

export const CatalogServiceCard: React.FC<Props> = ({ service }) => {
  const { t } = useTranslation();
  const router = useRouter();

  const priceNum = parseFloat(service.base_price) || 0;

  return (
    <View
      style={[
        styles.card,
        service.is_active ? styles.cardActive : styles.cardInactive,
        !service.is_active && { opacity: 0.8 },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.infoCol}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.serviceName,
                !service.is_active && { color: COLORS.secondary },
              ]}
            >
              {service.name}
            </Text>
            <View
              style={[
                styles.statusBadge,
                service.is_active ? styles.badgeActive : styles.badgeInactive,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  service.is_active ? styles.textActive : styles.textInactive,
                ]}
              >
                {service.is_active
                  ? t('serviceCatalog.active')
                  : t('serviceCatalog.inactive')}
              </Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={16} color={COLORS.secondary} />
              <Text style={styles.metaText}>
                {service.duration_minutes} {t('serviceCatalog.minutes')}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Award size={16} color={COLORS.secondary} />
              <Text style={styles.metaText}>
                {service.points_reward} {t('serviceCatalog.points')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.priceCol}>
          <View style={styles.priceInfo}>
            <Text style={styles.priceLabel}>{t('serviceCatalog.price')}</Text>
            <Text
              style={[
                styles.priceValue,
                !service.is_active && { color: COLORS.secondary },
              ]}
            >
              ${priceNum.toFixed(2)}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.manageBtn,
              !service.is_active && { backgroundColor: '#e0e3e5' },
            ]}
            onPress={() => router.push(`/services/${service.id}` as any)}
          >
            <Text
              style={[
                styles.manageText,
                !service.is_active && { color: COLORS.secondary },
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
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    marginHorizontal: 24,
    borderLeftWidth: 4,
    ...SHADOWS.sm,
  },
  cardActive: {
    borderLeftColor: '#10b981',
  },
  cardInactive: {
    borderLeftColor: '#94a3b8',
    backgroundColor: '#f2f4f6',
  },
  cardHeader: {
    flexDirection: 'column',
    gap: 16,
  },
  infoCol: {
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
  },
  badgeActive: {
    backgroundColor: '#dcfce7',
  },
  badgeInactive: {
    backgroundColor: '#e0e3e5',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  textActive: {
    color: '#065f46',
  },
  textInactive: {
    color: COLORS.secondary,
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
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  priceCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  priceInfo: {
    alignItems: 'flex-start',
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.secondary,
    letterSpacing: 1.5,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  manageBtn: {
    backgroundColor: '#e6e8ea',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  manageText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
});
