import React from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';
import { useBookingStore } from '@/src/store/useBookingStore';
import {
  useServices,
  useStaffServices,
} from '@/src/hooks/queries/useMasterData';
import { BookingServiceItem } from '@/src/components/booking/BookingServiceItem';
import { BookingStickyFooter } from '@/src/components/booking/BookingStickyFooter';
import { useRouter } from 'expo-router';
import { Screen } from '@/src/components/common/Screen';

export default function BookingServicesScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const {
    selectedServices,
    toggleService,
    totalPrice,
    entryPoint,
    selectedStaff,
    selectedStaffId,
  } = useBookingStore();
  const isStaffFirst = entryPoint === 'staff_first' && !!selectedStaffId;
  const allServicesQuery = useServices(undefined, !isStaffFirst);
  const staffServicesQuery = useStaffServices(selectedStaffId, isStaffFirst);
  const servicesQuery = isStaffFirst ? staffServicesQuery : allServicesQuery;
  const { data: services, isLoading, error } = servicesQuery;

  return (
    <View style={styles.root}>
      <Screen
        loading={isLoading}
        error={error}
        style={{ backgroundColor: colors.background }}
        transparentStatusBar
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {entryPoint === 'staff_first' && selectedStaff && (
            <Typography
              variant="caption"
              style={[styles.staffContext, { color: colors.onSurfaceVariant }]}
            >
              {t('booking.bookingWith', {
                name: `${selectedStaff.first_name} ${selectedStaff.last_name}`,
                defaultValue: `Booking with ${selectedStaff.first_name} ${selectedStaff.last_name}`,
              })}
            </Typography>
          )}

          <Typography
            variant="h2"
            style={[styles.title, { color: colors.text }]}
          >
            {t('booking.steps.services')}
          </Typography>

          <View style={styles.list}>
            {services?.map((srv) => (
              <BookingServiceItem
                key={srv.id}
                name={srv.name}
                duration={srv.duration_minutes}
                price={`${srv.base_price} TL`}
                isSelected={selectedServices.some((s) => s.id === srv.id)}
                onToggle={() => toggleService(srv)}
              />
            ))}
          </View>

          {/* Decorative Banner */}
          <View
            style={[
              styles.banner,
              {
                borderColor: colors.outlineVariant,
                backgroundColor: colors.card,
              },
            ]}
          >
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&fit=crop',
              }}
              style={[styles.bannerImage, { opacity: isDark ? 0.3 : 0.6 }]}
            />
            <View style={styles.bannerOverlay}>
              <Typography variant="h3" style={styles.bannerTitle}>
                {t('booking.craftingConfidence')}
              </Typography>
              <Typography variant="caption" style={styles.bannerSubtitle}>
                {t('booking.secureSession')}
              </Typography>
            </View>
          </View>
        </ScrollView>
      </Screen>

      <BookingStickyFooter
        label={t(
          selectedServices.length === 1
            ? 'booking.serviceSelected'
            : 'booking.servicesSelected',
          { count: selectedServices.length },
        )}
        value={`${totalPrice} TL`}
        buttonText={t('booking.continue')}
        onPress={() => router.push('/booking/slots')}
        disabled={selectedServices.length === 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 140,
  },
  staffContext: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 20,
  },
  list: {
    gap: 4,
  },
  banner: {
    marginTop: 32,
    height: 140,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerOverlay: {
    alignItems: 'center',
    padding: 20,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '700',
    marginTop: 4,
  },
});
