import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  MapPin,
  Phone,
  Navigation as NavigationIcon,
} from 'lucide-react-native';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';
import { LocationMap } from '@/src/components/common/LocationMap';

interface ShopInfoCardProps {
  shopName: string;
  shopImage?: string;
  barberName: string;
  address: string;
  latitude?: number;
  longitude?: number;
  onCall: () => void;
  onDirections: () => void;
}

export const ShopInfoCard = ({
  shopName,
  shopImage,
  barberName,
  address,
  latitude,
  longitude,
  onCall,
  onDirections,
}: ShopInfoCardProps) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.outlineVariant,
        },
      ]}
    >
      <View style={styles.header}>
        <Image
          source={{
            uri:
              shopImage ||
              'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200&h=200&fit=crop',
          }}
          style={[styles.shopImage, { borderColor: colors.outlineVariant }]}
        />
        <View style={styles.headerInfo}>
          <Typography
            variant="h2"
            style={[styles.shopName, { color: colors.text }]}
          >
            {shopName}
          </Typography>
          <View style={styles.barberRow}>
            <Typography
              variant="caption"
              style={{ color: colors.onSurfaceVariant }}
            >
              {t('booking.barber')}:{' '}
            </Typography>
            <Typography
              variant="caption"
              style={[styles.barberName, { color: colors.text }]}
            >
              {barberName}
            </Typography>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.addressBox,
          {
            backgroundColor: isDark ? colors.surfaceContainerLow : '#f9fafb',
            borderColor: colors.outlineVariant,
          },
        ]}
      >
        <MapPin size={18} color="#f59e0b" style={styles.mapIcon} />
        <Typography
          variant="body"
          style={[styles.addressText, { color: colors.onSurfaceVariant }]}
        >
          {address}
        </Typography>
      </View>

      {latitude && longitude && (
        <LocationMap
          latitude={latitude}
          longitude={longitude}
          title={shopName}
          style={styles.mapContainer}
        />
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={onCall}
          style={[
            styles.actionButton,
            {
              backgroundColor: isDark ? colors.surfaceContainerHigh : '#f3f4f6',
            },
          ]}
        >
          <Phone size={16} color={colors.text} />
          <Typography
            variant="label"
            style={[styles.actionText, { color: colors.text }]}
          >
            {t('common.callShop')}
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onDirections}
          style={[styles.actionButton, styles.primaryButton]}
        >
          <NavigationIcon size={16} color="#000" />
          <Typography
            variant="label"
            style={[styles.actionText, { color: '#000' }]}
          >
            {t('appointments.directions')}
          </Typography>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  shopImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
  },
  headerInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 2,
  },
  barberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barberName: {
    fontWeight: '700',
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  mapIcon: {
    flexShrink: 0,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },
  mapContainer: {
    width: '100%',
    height: 128,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: '#f59e0b',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
