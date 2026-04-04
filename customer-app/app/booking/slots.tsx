import {
  addDays,
  format,
  isSameDay,
  isToday,
  isTomorrow,
  parseISO,
  startOfDay,
} from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
  Sparkles,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Screen } from '@/src/components/common/Screen';
import { Typography } from '@/src/components/ui';
import { COLORS, SIZES } from '@/src/constants/theme';
import {
  useAvailabilitySearch,
  useSlotRecommendations,
} from '@/src/hooks/queries/useAvailability';
import { useBookingStore } from '@/src/store/useBookingStore';
import { useTenantStore } from '@/src/store/useTenantStore';
import { RecommendedSlot } from '@/src/types';

export default function SlotsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const {
    selectedSlot,
    setSlot,
    setStaff,
    selectedServices,
    selectedStaff,
    isRebookMode,
    rebookSource,
    reset: resetBooking,
  } = useBookingStore();
  const { config, getBranding } = useTenantStore();
  const { primaryColor } = getBranding();
  const tenantId = config?.id;

  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const flatListRef = useRef<FlatList>(null);

  const dates = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => addDays(startOfDay(new Date()), i)),
    [],
  );
  const dateLocale = i18n.language.startsWith('tr') ? tr : enUS;

  // Center selected date on change
  useEffect(() => {
    const index = dates.findIndex((d) => isSameDay(d, selectedDate));
    if (index !== -1 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5,
        });
      }, 100);
    }
  }, [selectedDate, dates]);

  const {
    data: slots,
    isLoading,
    error,
  } = useAvailabilitySearch({
    date: format(selectedDate, 'yyyy-MM-dd'),
    service_ids: selectedServices.map((s) => s.id),
    staff_user_id: selectedStaff?.id,
    tenant_id: tenantId as string,
  });

  const { data: recommendations } = useSlotRecommendations({
    service_ids: selectedServices.map((s) => s.id),
    staff_user_id: selectedStaff?.id,
  });

  const getLabelText = (label: RecommendedSlot['label']) => {
    switch (label) {
      case 'earliest':
        return t('booking.labelEarliest');
      case 'preferred_time':
        return t('booking.labelPreferredTime');
      case 'preferred_staff':
        return t('booking.labelPreferredStaff');
      case 'popular':
        return t('booking.labelPopular');
      default:
        return '';
    }
  };

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return t('booking.today');
    if (isTomorrow(date)) return t('booking.tomorrow');
    return format(date, dateLocale === tr ? 'EEE, d MMM' : 'EEE, MMM d', {
      locale: dateLocale,
    });
  };

  const handleSelectRecommendation = (rec: RecommendedSlot) => {
    const recDate = startOfDay(parseISO(rec.starts_at));
    setSelectedDate(recDate);
    setSlot({
      starts_at: rec.starts_at,
      ends_at: rec.ends_at,
      available_staff: rec.available_staff,
    });
  };

  // Group slots by time of day
  const groupedSlots = useMemo(() => {
    if (!slots) return { morning: [], afternoon: [], evening: [] };

    const available = (slots.slots || []).map((s) => ({
      ...s,
      is_available: true,
    }));
    const filled = (slots.filled_slots || []).map((s) => ({
      ...s,
      is_available: false,
    }));

    const allPreparedSlots = [...available, ...filled].sort(
      (a, b) =>
        parseISO(a.starts_at).getTime() - parseISO(b.starts_at).getTime(),
    );

    return allPreparedSlots.reduce(
      (acc: any, slot: any) => {
        const localHour = parseISO(slot.starts_at).getHours();
        if (localHour < 12) {
          acc.morning.push(slot);
        } else if (localHour < 17) {
          acc.afternoon.push(slot);
        } else {
          acc.evening.push(slot);
        }
        return acc;
      },
      { morning: [], afternoon: [], evening: [] },
    );
  }, [slots]);

  const handleSelectSlot = (slot: any) => {
    setSlot(slot);
  };

  const handleContinue = () => {
    if (selectedSlot) {
      if (isRebookMode) {
        // Check if pre-selected staff is available in the chosen slot
        if (selectedStaff) {
          const staffAvailable = selectedSlot.available_staff?.some(
            (s) => s.staff_user_id === selectedStaff.id,
          );
          if (!staffAvailable) {
            setStaff(null); // Fall back to "any available"
            Alert.alert(
              t('booking.rebookAppointment'),
              t('booking.staffNotAvailable'),
            );
          }
        }
        router.push('/booking/review');
      } else {
        router.push('/booking/staff');
      }
    }
  };

  const handlePrevDay = () => {
    const prevDay = addDays(selectedDate, -1);
    if (prevDay >= startOfDay(new Date())) {
      setSelectedDate(prevDay);
    }
  };

  const handleNextDay = () => {
    const nextDay = addDays(selectedDate, 1);
    const maxDate = dates[dates.length - 1];
    if (nextDay <= maxDate) {
      setSelectedDate(nextDay);
    }
  };

  // In rebook mode, show a specific error with a fallback to normal booking
  if (isRebookMode && error) {
    return (
      <Screen style={styles.container} transparentStatusBar>
        <View style={styles.rebookErrorState}>
          <Clock size={48} color={COLORS.border} />
          <Typography
            variant="h3"
            style={{ textAlign: 'center', marginTop: SIZES.md }}
          >
            {t('booking.serviceNoLongerAvailable')}
          </Typography>
          <TouchableOpacity
            onPress={() => {
              resetBooking();
              router.replace('/booking/services');
            }}
            style={[
              styles.confirmButton,
              { backgroundColor: primaryColor, marginTop: SIZES.xl },
            ]}
          >
            <Typography variant="label" style={styles.confirmButtonText}>
              {t('booking.startNewBooking')}
            </Typography>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      loading={isLoading}
      error={error}
      style={styles.container}
      transparentStatusBar
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Editorial Hero Section */}
        <View style={styles.heroSection}>
          <Typography variant="label" style={styles.stepIndicator}>
            {isRebookMode
              ? `${t('booking.step')} 1 ${t('booking.of')} 2`
              : `${t('booking.step')} 2 ${t('booking.of')} 4`}
          </Typography>
          <Typography variant="h1" style={styles.heroTitle}>
            {isRebookMode
              ? t('booking.rebookPickTime')
              : t('booking.secureSession')}
          </Typography>
        </View>

        {/* Rebook Context Card */}
        {isRebookMode && (
          <View style={styles.rebookBanner}>
            <RefreshCw size={16} color={primaryColor} />
            <Typography variant="body" style={styles.rebookBannerText}>
              {t('booking.rebookingBanner', {
                services: selectedServices.map((s) => s.name).join(' + '),
              })}
            </Typography>
            {rebookSource?.originalStaffName && (
              <Typography variant="caption" style={styles.rebookStaffText}>
                {rebookSource.originalStaffName}
              </Typography>
            )}
          </View>
        )}

        {/* Recommended Slots */}
        {recommendations && recommendations.length > 0 && (
          <View style={styles.recommendationsSection}>
            <View style={styles.recommendationsHeader}>
              <Sparkles size={16} color={primaryColor} />
              <Typography variant="label" style={styles.recommendationsTitle}>
                {t('booking.recommendedSlots')}
              </Typography>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recommendationsList}
            >
              {recommendations.map((rec, index) => {
                const isSelected = selectedSlot?.starts_at === rec.starts_at;
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleSelectRecommendation(rec)}
                    activeOpacity={0.7}
                    style={[
                      styles.recommendationCard,
                      isSelected && {
                        borderColor: primaryColor,
                        backgroundColor: primaryColor + '0A',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.recommendationBadge,
                        { backgroundColor: primaryColor + '15' },
                      ]}
                    >
                      <Typography
                        variant="caption"
                        style={[
                          styles.recommendationBadgeText,
                          { color: primaryColor },
                        ]}
                      >
                        {getLabelText(rec.label)}
                      </Typography>
                    </View>
                    <Typography variant="h3" style={styles.recommendationTime}>
                      {format(parseISO(rec.starts_at), 'HH:mm')}
                    </Typography>
                    <Typography
                      variant="caption"
                      style={styles.recommendationDate}
                    >
                      {getDateLabel(rec.starts_at)}
                    </Typography>
                    {rec.label === 'preferred_staff' &&
                      rec.available_staff?.[0] && (
                        <Typography
                          variant="caption"
                          style={styles.recommendationStaff}
                        >
                          {rec.available_staff[0].first_name}
                        </Typography>
                      )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Horizontal Calendar Selector */}
        <View style={styles.calendarSection}>
          <View style={styles.calendarHeader}>
            <Typography variant="h3" style={styles.monthTitle}>
              {format(selectedDate, 'MMMM yyyy', { locale: dateLocale })}
            </Typography>
            <View style={styles.calendarNav}>
              <TouchableOpacity
                onPress={handlePrevDay}
                style={[
                  styles.navButton,
                  isSameDay(selectedDate, startOfDay(new Date())) && {
                    opacity: 0.3,
                  },
                ]}
                disabled={isSameDay(selectedDate, startOfDay(new Date()))}
              >
                <ChevronLeft
                  size={16}
                  color={COLORS.secondary}
                  pointerEvents="none"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNextDay}
                style={[
                  styles.navButton,
                  isSameDay(selectedDate, dates[dates.length - 1]) && {
                    opacity: 0.3,
                  },
                ]}
                disabled={isSameDay(selectedDate, dates[dates.length - 1])}
              >
                <ChevronRight
                  size={16}
                  color={COLORS.secondary}
                  pointerEvents="none"
                />
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            ref={flatListRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            data={dates}
            keyExtractor={(item) => item.toISOString()}
            contentContainerStyle={styles.dateList}
            getItemLayout={(_, index) => ({
              length: 64 + 12, // width + marginRight
              offset: (64 + 12) * index,
              index,
            })}
            renderItem={({ item }) => {
              const isSelected = isSameDay(item, selectedDate);
              return (
                <TouchableOpacity
                  onPress={() => setSelectedDate(item)}
                  style={[
                    styles.dateCard,
                    isSelected && {
                      backgroundColor: COLORS.primary,
                      shadowColor: COLORS.primary,
                      shadowOffset: { width: 0, height: 12 },
                      shadowOpacity: 0.15,
                      shadowRadius: 32,
                      elevation: 5,
                    },
                  ]}
                >
                  <Typography
                    variant="caption"
                    style={[
                      styles.dayName,
                      isSelected && { color: COLORS.white, opacity: 0.8 },
                    ]}
                  >
                    {format(item, 'EEE', { locale: dateLocale }).toUpperCase()}
                  </Typography>
                  <Typography
                    variant="h3"
                    style={[
                      styles.dayNumber,
                      isSelected && { color: COLORS.white },
                    ]}
                  >
                    {format(item, 'd')}
                  </Typography>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Time Slots Sections */}
        <View style={styles.slotsSection}>
          {groupedSlots.morning.length > 0 && (
            <View style={styles.timeOfDayBlock}>
              <Typography variant="label" style={styles.timeOfDayTitle}>
                {t('booking.morning')}
              </Typography>
              <View style={styles.slotsGrid}>
                {groupedSlots.morning.map((slot: any, index: number) => {
                  const isSelected = selectedSlot?.starts_at === slot.starts_at;
                  const isAvailable = slot.is_available !== false;

                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => isAvailable && handleSelectSlot(slot)}
                      activeOpacity={isAvailable ? 0.7 : 1}
                      style={[
                        styles.slotButton,
                        isSelected && styles.selectedSlot,
                        !isAvailable && styles.filledSlot,
                      ]}
                    >
                      <Typography
                        variant="label"
                        style={[
                          styles.slotTimeText,
                          isSelected && { fontWeight: '800' },
                          !isAvailable && styles.filledSlotText,
                        ]}
                      >
                        {format(parseISO(slot.starts_at), 'HH:mm')}
                      </Typography>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {groupedSlots.afternoon.length > 0 && (
            <View style={styles.timeOfDayBlock}>
              <Typography variant="label" style={styles.timeOfDayTitle}>
                {t('booking.afternoon')}
              </Typography>
              <View style={styles.slotsGrid}>
                {groupedSlots.afternoon.map((slot: any, index: number) => {
                  const isSelected = selectedSlot?.starts_at === slot.starts_at;
                  const isAvailable = slot.is_available !== false;

                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => isAvailable && handleSelectSlot(slot)}
                      activeOpacity={isAvailable ? 0.7 : 1}
                      style={[
                        styles.slotButton,
                        isSelected && styles.selectedSlot,
                        !isAvailable && styles.filledSlot,
                      ]}
                    >
                      <Typography
                        variant="label"
                        style={[
                          styles.slotTimeText,
                          isSelected && { fontWeight: '800' },
                          !isAvailable && styles.filledSlotText,
                        ]}
                      >
                        {format(parseISO(slot.starts_at), 'HH:mm')}
                      </Typography>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {groupedSlots.evening.length > 0 && (
            <View style={styles.timeOfDayBlock}>
              <Typography variant="label" style={styles.timeOfDayTitle}>
                {t('booking.evening')}
              </Typography>
              <View style={styles.slotsGrid}>
                {groupedSlots.evening.map((slot: any, index: number) => {
                  const isSelected = selectedSlot?.starts_at === slot.starts_at;
                  const isAvailable = slot.is_available !== false;

                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => isAvailable && handleSelectSlot(slot)}
                      activeOpacity={isAvailable ? 0.7 : 1}
                      style={[
                        styles.slotButton,
                        isSelected && styles.selectedSlot,
                        !isAvailable && styles.filledSlot,
                      ]}
                    >
                      <Typography
                        variant="label"
                        style={[
                          styles.slotTimeText,
                          isSelected && { fontWeight: '800' },
                          !isAvailable && styles.filledSlotText,
                        ]}
                      >
                        {format(parseISO(slot.starts_at), 'HH:mm')}
                      </Typography>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {!isLoading &&
            groupedSlots.morning.length === 0 &&
            groupedSlots.afternoon.length === 0 &&
            groupedSlots.evening.length === 0 && (
              <View style={styles.emptyState}>
                <Clock size={48} color={COLORS.border} />
                <Typography
                  variant="body"
                  color={COLORS.secondary}
                  style={{ marginTop: SIZES.md }}
                >
                  {t('booking.noSlots')}
                </Typography>
              </View>
            )}
        </View>

        {/* Selected Services Ghost Card */}
        <View style={styles.selectionCard}>
          <View style={styles.selectionRow}>
            <View>
              <Typography variant="label" style={styles.selectionLabel}>
                {t('booking.selectedArtisan')}
              </Typography>
              <Typography variant="h3" style={styles.selectionValue}>
                {selectedStaff
                  ? `${selectedStaff.first_name} ${selectedStaff.last_name}`
                  : t('booking.anyStaff')}
              </Typography>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Typography variant="label" style={styles.selectionLabel}>
                {t('booking.service')}
              </Typography>
              <Typography variant="h3" style={styles.selectionValue}>
                {selectedServices[0]?.name || 'N/A'}
                {selectedServices.length > 1 &&
                  ` +${selectedServices.length - 1}`}
              </Typography>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.stickyFooter}>
        <View style={styles.footerContent}>
          <View style={styles.appointmentInfo}>
            <Typography variant="label" style={styles.footerLabel}>
              {t('booking.appointment')}
            </Typography>
            <Typography variant="body" style={styles.footerValue}>
              {selectedSlot
                ? format(
                    parseISO(selectedSlot.starts_at),
                    dateLocale === tr
                      ? 'd MMMM, EEE @ HH:mm'
                      : 'EEE, MMM d @ HH:mm',
                    {
                      locale: dateLocale,
                    },
                  )
                : t('booking.selectTimeSlot')}
            </Typography>
          </View>
          <TouchableOpacity
            onPress={handleContinue}
            disabled={!selectedSlot}
            style={[
              styles.confirmButton,
              !selectedSlot && styles.disabledButton,
              { backgroundColor: primaryColor },
            ]}
          >
            <Typography variant="label" style={styles.confirmButtonText}>
              {t('booking.confirm')}
            </Typography>
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
  scrollContent: {
    paddingBottom: 120,
  },
  heroSection: {
    paddingHorizontal: SIZES.padding,
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
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1.5,
    lineHeight: 36,
    color: COLORS.text,
  },
  recommendationsSection: {
    marginBottom: SIZES.xl,
    paddingTop: SIZES.sm,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: SIZES.padding,
    marginBottom: 16,
  },
  recommendationsTitle: {
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  recommendationsList: {
    paddingHorizontal: SIZES.padding,
    gap: 12,
  },
  recommendationCard: {
    width: 130,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerLowest,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 6,
  },
  recommendationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 4,
  },
  recommendationBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  recommendationTime: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -1,
  },
  recommendationDate: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  recommendationStaff: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.secondary,
    marginTop: 2,
  },
  calendarSection: {
    marginBottom: SIZES.xl,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    marginBottom: SIZES.md,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  calendarNav: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateList: {
    paddingHorizontal: SIZES.padding,
    paddingBottom: 10,
  },
  dateCard: {
    width: 64,
    height: 96,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    gap: 4,
  },
  dayName: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.secondary,
    letterSpacing: 0.5,
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '800',
  },
  slotsSection: {
    paddingHorizontal: SIZES.padding,
  },
  timeOfDayBlock: {
    marginBottom: SIZES.xl,
  },
  timeOfDayTitle: {
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 16,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  slotButton: {
    width: '31%',
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  slotTimeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedSlot: {
    backgroundColor: COLORS.surfaceContainerHighest,
    borderColor: COLORS.primary + '33',
    borderWidth: 2,
  },
  filledSlot: {
    opacity: 0.35,
    backgroundColor: COLORS.surfaceContainerLowest,
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 0,
  },
  filledSlotText: {
    textDecorationLine: 'line-through',
    color: COLORS.secondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.xl * 2,
  },
  selectionCard: {
    marginHorizontal: SIZES.padding,
    marginTop: SIZES.xl,
    padding: 24,
    borderRadius: 32,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  selectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  selectionValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: SIZES.padding,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appointmentInfo: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  footerValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  confirmButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  disabledButton: {
    opacity: 0.3,
    shadowOpacity: 0,
  },
  rebookErrorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding * 2,
  },
  rebookBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: SIZES.padding,
    marginBottom: SIZES.md,
    padding: 16,
    borderRadius: 20,
    backgroundColor: COLORS.secondaryContainer,
    flexWrap: 'wrap',
  },
  rebookBannerText: {
    flex: 1,
    fontWeight: '700',
    color: COLORS.onSecondaryContainer,
    fontSize: 14,
  },
  rebookStaffText: {
    width: '100%',
    marginLeft: 26,
    fontWeight: '600',
    color: COLORS.onSecondaryContainer,
    opacity: 0.7,
  },
});
