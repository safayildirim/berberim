import { format, parseISO } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { Calendar, Clock, Info, Star } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Screen } from '@/src/components/common/Screen';
import { StaffAvatar } from '@/src/components/common/StaffAvatar';
import { Button, Typography } from '@/src/components/ui';
import { COLORS, SIZES } from '@/src/constants/theme';
import { useCreateAppointment } from '@/src/hooks/mutations/useAppointmentMutations';
import { useBookingStore } from '@/src/store/useBookingStore';
import { useTenantStore } from '@/src/store/useTenantStore';

export default function ReviewScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const {
    selectedServices,
    selectedStaff,
    selectedSlot,
    notes,
    totalPrice,
    totalDuration,
    isRebookMode,
    reset: resetBooking,
  } = useBookingStore();

  const { config, getBranding } = useTenantStore();
  const { primaryColor } = getBranding();
  const tenantId = config?.id;

  const [localNotes, setLocalNotes] = useState(notes);
  const dateLocale = i18n.language.startsWith('tr') ? tr : enUS;

  const { mutate: createAppointment, isPending } = useCreateAppointment();

  const handleConfirm = () => {
    if (!selectedSlot || !tenantId) return;

    createAppointment(
      {
        starts_at: selectedSlot.starts_at,
        service_ids: selectedServices.map((s) => s.id),
        staff_user_id: selectedStaff?.id || '',
        notes_customer: localNotes,
        tenant_id: tenantId,
      },
      {
        onSuccess: (data) => {
          router.push({
            pathname: '/booking/success',
            params: { id: data.id },
          });
        },
        onError: (error: any) => {
          const message =
            error.status === 429
              ? t('booking.weeklyLimitReached')
              : error.message;
          Alert.alert(t('booking.bookingFailed'), message);
        },
      },
    );
  };

  if (!selectedSlot) {
    return (
      <Screen style={styles.container} transparentStatusBar>
        <View style={styles.emptyState}>
          <Typography>{t('booking.selectTimeFirst')}</Typography>
        </View>
      </Screen>
    );
  }

  const startTime = parseISO(selectedSlot.starts_at);

  return (
    <Screen style={styles.container} transparentStatusBar>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* Editorial Hero Section */}
          <View style={styles.heroSection}>
            <Typography variant="label" style={styles.stepIndicator}>
              {isRebookMode
                ? `${t('booking.step')} 2 ${t('booking.of')} 2`
                : `${t('booking.step')} 4 ${t('booking.of')} 4`}
            </Typography>
            <Typography variant="h1" style={styles.heroTitle}>
              {t('booking.reviewTitle')}
            </Typography>
            <Typography variant="body" color={COLORS.onSurfaceVariant}>
              {t('booking.reviewSummary')}
            </Typography>
          </View>

          <View>
            {/* Main Details Card */}
            <View style={styles.mainCard}>
              <View style={styles.barberHeader}>
                <View style={styles.barberInfo}>
                  <StaffAvatar
                    staff={selectedStaff}
                    size={48}
                    style={styles.barberAvatar}
                  />
                  <View>
                    <Typography variant="caption" style={styles.label}>
                      {t('booking.barber').toUpperCase()}
                    </Typography>
                    <Typography variant="h3" style={styles.barberName}>
                      {selectedStaff
                        ? `${selectedStaff.first_name} ${selectedStaff.last_name}`
                        : t('booking.anyAvailable')}
                    </Typography>
                  </View>
                </View>
                <View style={styles.ratingBadge}>
                  <View style={styles.ratingValue}>
                    <Star size={14} color={primaryColor} fill={primaryColor} />
                    <Typography variant="h3" style={{ fontSize: 14 }}>
                      {selectedStaff?.avg_rating?.toFixed(1) ?? '—'}
                    </Typography>
                  </View>
                </View>
              </View>

              {/* Date & Time Grid */}
              <View style={styles.dateTimeGrid}>
                <View style={styles.gridItem}>
                  <Calendar size={20} color={primaryColor} />
                  <Typography variant="caption" style={styles.gridLabel}>
                    {t('booking.dateLabel').toUpperCase()}
                  </Typography>
                  <Typography variant="h3" style={styles.gridValue}>
                    {format(startTime, 'MMM d, yyyy', { locale: dateLocale })}
                  </Typography>
                </View>
                <View style={styles.gridItem}>
                  <Clock size={20} color={primaryColor} />
                  <Typography variant="caption" style={styles.gridLabel}>
                    {t('booking.timeLabel').toUpperCase()}
                  </Typography>
                  <Typography variant="h3" style={styles.gridValue}>
                    {format(startTime, 'HH:mm')} {format(startTime, 'a')}
                  </Typography>
                </View>
              </View>

              {/* Services List */}
              <View style={styles.servicesSection}>
                <Typography variant="caption" style={styles.sectionHeaderLabel}>
                  {t('booking.servicesLabel').toUpperCase()}
                </Typography>
                <View style={{ gap: 12 }}>
                  {selectedServices.map((service) => (
                    <View key={service.id} style={styles.serviceItem}>
                      <View>
                        <Typography
                          variant="body"
                          style={{ fontWeight: '700' }}
                        >
                          {service.name}
                        </Typography>
                        <Typography variant="caption" color={COLORS.secondary}>
                          {service.duration_minutes} {t('booking.minutes')}
                        </Typography>
                      </View>
                      <Typography
                        variant="h3"
                        style={{ color: primaryColor, fontSize: 16 }}
                      >
                        ${service.base_price}
                      </Typography>
                    </View>
                  ))}
                </View>
              </View>

              {/* Notes Input */}
              <View style={styles.notesSection}>
                <Typography variant="caption" style={styles.sectionHeaderLabel}>
                  {t('booking.additionalNotes').toUpperCase()}
                </Typography>
                <TextInput
                  style={styles.noteInput}
                  placeholder={t('booking.notePlaceholderInput')}
                  multiline
                  value={localNotes}
                  onChangeText={setLocalNotes}
                  placeholderTextColor={COLORS.secondary}
                />
              </View>
            </View>

            {/* Cancellation Notice */}
            <View style={styles.cancellationNotice}>
              <View style={styles.infoIconContainer}>
                <Info size={18} color={primaryColor} />
              </View>
              <Typography variant="body" style={styles.cancellationText}>
                {t('booking.cancellationPolicy')}
              </Typography>
            </View>
          </View>

          {isRebookMode ? (
            <Button
              variant="ghost"
              title={t('booking.startNewBooking')}
              onPress={() => {
                resetBooking();
                router.replace('/booking/services');
              }}
              style={styles.modifyButton}
              titleStyle={{ color: COLORS.onSurfaceVariant, fontWeight: '700' }}
            />
          ) : (
            <Button
              variant="ghost"
              title={t('booking.modifySelection')}
              onPress={() => router.push('/booking/services')}
              style={styles.modifyButton}
              titleStyle={{ color: COLORS.onSurfaceVariant, fontWeight: '700' }}
            />
          )}
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.priceBreakdown}>
            <View>
              <Typography variant="caption" color={COLORS.onSurfaceVariant}>
                {t('booking.bookingDuration')}
              </Typography>
              <Typography variant="h3" style={{ fontSize: 16 }}>
                {totalDuration} {t('booking.minutes')}
              </Typography>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Typography variant="caption" color={COLORS.onSurfaceVariant}>
                {t('booking.totalPriceLabel')}
              </Typography>
              <Typography variant="h1" style={styles.stickyPrice}>
                ${totalPrice}
              </Typography>
            </View>
          </View>
          <Button
            title={t('booking.confirmBookingAction')}
            loading={isPending}
            onPress={handleConfirm}
            style={styles.confirmButton}
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
  },
  scroll: {
    paddingHorizontal: SIZES.padding,
    paddingBottom: 220,
  },
  heroSection: {
    marginTop: SIZES.md,
    marginBottom: SIZES.md,
  },
  stepIndicator: {
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -2,
    lineHeight: 44,
    color: COLORS.text,
    marginBottom: 8,
  },
  mainCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 40,
    padding: SIZES.padding,
  },
  barberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  barberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  barberAvatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '700',
    color: COLORS.primary,
    fontSize: 10,
    marginBottom: 4,
  },
  barberName: {
    fontSize: 20,
    fontWeight: '800',
  },
  ratingBadge: {
    backgroundColor: COLORS.surfaceContainerLowest,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  ratingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateTimeGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  gridItem: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: 20,
    borderRadius: 24,
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  servicesSection: {
    marginBottom: 32,
  },
  sectionHeaderLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 2,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: 16,
    borderRadius: 20,
  },
  notesSection: {
    marginBottom: 32,
  },
  noteInput: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 20,
    padding: 16,
    minHeight: 80,
    fontSize: 14,
    color: COLORS.text,
    textAlignVertical: 'top',
  },
  cancellationNotice: {
    backgroundColor: COLORS.secondaryContainer,
    borderRadius: 32,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  infoIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    padding: 10,
    borderRadius: 20,
  },
  cancellationText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.onSecondaryContainer,
    lineHeight: 20,
  },
  modifyButton: {
    marginTop: 20,
  },
  footer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  priceBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SIZES.sm,
  },
  stickyPrice: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: -1,
  },
  confirmButton: {
    width: '100%',
    borderRadius: 32,
    height: 72,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
