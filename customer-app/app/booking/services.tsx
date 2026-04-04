import { useRouter } from 'expo-router';
import { ArrowRight, Check, Clock } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/src/components/common/Screen';
import { Typography } from '@/src/components/ui';
import { COLORS, SHADOWS, SIZES } from '@/src/constants/theme';
import { useServices } from '@/src/hooks/queries/useMasterData';
import { useBookingStore } from '@/src/store/useBookingStore';

export default function ServicesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { selectedServices, toggleService, totalPrice } = useBookingStore();

  const { data: services, isLoading, error } = useServices();

  return (
    <Screen
      loading={isLoading}
      error={error}
      empty={services?.length === 0}
      style={styles.container}
      transparentStatusBar
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 120 },
        ]}
      >
        {/* Editorial Hero Section */}
        <View style={styles.heroSection}>
          <Typography variant="label" style={styles.stepIndicator}>
            {t('booking.step')} 1 {t('booking.of')} 4
          </Typography>
          <Typography variant="h1" style={styles.heroTitle}>
            {t('booking.artisanTreatments')}
          </Typography>
        </View>

        {/* Service Grid */}
        <View style={styles.grid}>
          {services?.map((service) => {
            const isSelected = selectedServices.some(
              (s) => s.id === service.id,
            );
            return (
              <TouchableOpacity
                key={service.id}
                activeOpacity={0.9}
                onPress={() => toggleService(service)}
                style={[
                  styles.serviceCard,
                  isSelected ? styles.selectedCard : styles.unselectedCard,
                ]}
              >
                <View style={styles.serviceMain}>
                  <Typography
                    variant="h3"
                    style={[
                      styles.serviceName,
                      { color: isSelected ? COLORS.white : COLORS.text },
                    ]}
                  >
                    {service.name}
                  </Typography>
                  <View style={styles.durationRow}>
                    <Clock
                      size={14}
                      color={
                        isSelected ? 'rgba(255,255,255,0.6)' : COLORS.secondary
                      }
                      pointerEvents="none"
                    />
                    <Typography
                      variant="caption"
                      style={{
                        color: isSelected
                          ? 'rgba(255,255,255,0.6)'
                          : COLORS.secondary,
                        fontWeight: '600',
                      }}
                    >
                      {service.duration_minutes} {t('booking.minutes')}
                    </Typography>
                  </View>
                </View>

                <View style={styles.priceColumn}>
                  <Typography
                    variant="h3"
                    style={[
                      styles.priceText,
                      { color: isSelected ? COLORS.white : COLORS.text },
                    ]}
                  >
                    ${service.base_price}
                  </Typography>
                  <View
                    style={[
                      styles.indicatorCircle,
                      isSelected
                        ? styles.selectedIndicator
                        : styles.unselectedIndicator,
                    ]}
                  >
                    {isSelected && (
                      <Check
                        size={12}
                        color={COLORS.white}
                        strokeWidth={3}
                        pointerEvents="none"
                      />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Featured Image Card */}
        <View style={styles.featuredContainer}>
          <ImageBackground
            source={{
              uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBHt5gZM_l25tbXcmLd317dViq1WTCsNvKHvxDTc7bmWipaTQTuZS7LZasJCNvy0s6zs6giYYfHtyKNtbvG84Yxdd-yc0K3olInwCgXGur4DmMOftvQv31XnJnslJ1LddCH5ER21atLGXecaSNBdWD9s1G5mAUHZam64lO81uKjbeTMq6BnrgJ0FJkmHJ0j2PJbgEnRQK2NzwlfhVCT6dmutbVMIjgvMBTXfjh7yifHPys3stOu28YvEqTLjxeVxJYSNuhkyFHBSDU3',
            }}
            style={styles.featuredImage}
            imageStyle={{ borderRadius: 24 }}
          >
            <View style={styles.featuredOverlay}>
              <Typography
                variant="h3"
                color={COLORS.white}
                style={styles.featuredText}
              >
                {t('booking.craftingConfidence')}
              </Typography>
            </View>
          </ImageBackground>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View
        style={[styles.stickyBottomBar, { paddingBottom: insets.bottom + 16 }]}
      >
        <View style={styles.summaryContainer}>
          <View style={styles.summaryInfo}>
            <View style={styles.totalRow}>
              <Typography variant="h2" style={styles.totalPrice}>
                ${totalPrice}
              </Typography>
              <Typography variant="caption" style={styles.totalLabel}>
                {t('booking.total').toUpperCase()}
              </Typography>
            </View>
            <Typography
              variant="caption"
              color={COLORS.onSurfaceVariant}
              style={{ fontWeight: '600' }}
            >
              {selectedServices.length}{' '}
              {selectedServices.length === 1
                ? t('booking.serviceSelected')
                : t('booking.servicesSelected')}
            </Typography>
          </View>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push('/booking/slots')}
            disabled={selectedServices.length === 0}
            style={[
              styles.continueBtn,
              selectedServices.length === 0 && styles.disabledBtn,
            ]}
          >
            <Typography
              variant="label"
              color={COLORS.white}
              style={styles.continueBtnText}
            >
              {t('booking.continue')}
            </Typography>
            <ArrowRight size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    backgroundColor: COLORS.background,
  },
  scroll: {
    // Padding moved to sections
  },
  heroSection: {
    paddingHorizontal: SIZES.padding,
    marginTop: SIZES.xl,
    marginBottom: SIZES.lg,
  },
  stepIndicator: {
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1.5,
    lineHeight: 36,
    color: COLORS.text,
  },
  grid: {
    paddingHorizontal: SIZES.padding,
    gap: 20,
  },
  serviceCard: {
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  selectedCard: {
    backgroundColor: COLORS.primaryContainer,
  },
  unselectedCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  serviceMain: {
    flex: 1,
    gap: 4,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceColumn: {
    alignItems: 'flex-end',
    gap: 12,
  },
  priceText: {
    fontSize: 20,
    fontWeight: '900',
  },
  indicatorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIndicator: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  unselectedIndicator: {
    borderColor: 'rgba(196, 199, 199, 0.3)',
    backgroundColor: 'transparent',
  },
  featuredContainer: {
    paddingHorizontal: SIZES.padding,
    marginTop: 48,
    height: 240,
  },
  featuredImage: {
    flex: 1,
  },
  featuredOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 24,
    justifyContent: 'flex-end',
    padding: 24,
  },
  featuredText: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    maxWidth: '80%',
  },
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SIZES.padding,
    zIndex: 100,
  },
  summaryContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 40,
    padding: 12,
    paddingLeft: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  summaryInfo: {
    flex: 1,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: '900',
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    opacity: 0.6,
  },
  continueBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...SHADOWS.md,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '900',
  },
  disabledBtn: {
    opacity: 0.5,
  },
});
