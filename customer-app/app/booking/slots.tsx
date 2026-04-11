import React, { useMemo } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { RotateCcw, Star } from 'lucide-react-native';
import { addDays, format, parseISO, startOfDay } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { Typography } from '@/src/components/ui';
import { Screen } from '@/src/components/common/Screen';
import { BookingStickyFooter } from '@/src/components/booking/BookingStickyFooter';
import { useMultiDayAvailability } from '@/src/hooks/queries/useAvailability';
import { useBookingStore } from '@/src/store/useBookingStore';
import { useTenantStore } from '@/src/store/useTenantStore';
import { useTheme } from '@/src/store/useThemeStore';
import { AvailabilitySlot } from '@/src/types';

const dateKey = (date: Date) => format(date, 'yyyy-MM-dd');
const DATE_CARD_WIDTH = 64;
const DATE_CARD_GAP = 10;

type SlotPeriod = 'morning' | 'afternoon' | 'evening';
type RecommendationLabel =
  | 'earliest'
  | 'preferred_time'
  | 'preferred_staff'
  | 'popular';

const getPeriodLabel = (
  period: SlotPeriod,
  t: ReturnType<typeof useTranslation>['t'],
) => {
  switch (period) {
    case 'morning':
      return t('booking.slots.morning');
    case 'afternoon':
      return t('booking.slots.afternoon');
    case 'evening':
      return t('booking.slots.evening');
  }
};

const getRecommendationLabel = (
  label: RecommendationLabel,
  t: ReturnType<typeof useTranslation>['t'],
) => {
  switch (label) {
    case 'earliest':
      return t('booking.slots.earliest');
    case 'preferred_time':
      return t('booking.slots.preferred_time');
    case 'preferred_staff':
      return t('booking.slots.preferred_staff');
    case 'popular':
      return t('booking.slots.popular');
  }
};

export default function BookingSlotsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const { config } = useTenantStore();
  const {
    entryPoint,
    selectedDate,
    selectedServiceIds,
    selectedServices,
    selectedSlot,
    selectedStaffId,
    selectedStaffChoice,
    selectedStaff,
    isRebookMode,
    rebookSource,
    setSelectedDate,
    setSlot,
    setStaff,
  } = useBookingStore();
  const dateScrollRef = React.useRef<ScrollView>(null);

  const today = useMemo(() => startOfDay(new Date()), []);
  const dates = useMemo(
    () => Array.from({ length: 14 }, (_, index) => addDays(today, index)),
    [today],
  );
  const fromDate = dateKey(dates[0]);
  const toDate = dateKey(dates[dates.length - 1]);
  const activeDate = selectedDate || fromDate;
  const dateLocale = i18n.language.startsWith('tr') ? tr : enUS;

  const { data, isLoading, error, refetch, isFetching } =
    useMultiDayAvailability({
      tenant_id: config?.id || '',
      service_ids: selectedServiceIds,
      staff_user_id:
        entryPoint === 'staff_first' || selectedStaffChoice === 'specific'
          ? selectedStaffId || undefined
          : undefined,
      from_date: fromDate,
      to_date: toDate,
    });

  const dayAvailability = useMemo(
    () => data?.days?.find((day) => day.date === activeDate),
    [activeDate, data?.days],
  );

  const groupedSlots = useMemo(() => {
    const slots = dayAvailability?.slots || [];
    return slots.reduce(
      (acc, slot) => {
        const hour = parseISO(slot.starts_at).getHours();
        if (hour < 12) acc.morning.push(slot);
        else if (hour < 17) acc.afternoon.push(slot);
        else acc.evening.push(slot);
        return acc;
      },
      {
        morning: [] as AvailabilitySlot[],
        afternoon: [] as AvailabilitySlot[],
        evening: [] as AvailabilitySlot[],
      },
    );
  }, [dayAvailability?.slots]);

  const selectedServiceLabel =
    selectedServices.length === 0
      ? t('booking.steps.services')
      : `${selectedServices[0].name}${selectedServices.length > 1 ? ` +${selectedServices.length - 1}` : ''}`;

  const getRecommendationDateLabel = (startsAt: string) => {
    const day = dateKey(parseISO(startsAt));
    if (day === dateKey(today)) return t('booking.today');
    if (day === dateKey(addDays(today, 1))) return t('booking.tomorrow');
    return format(parseISO(startsAt), 'EEE d MMM', { locale: dateLocale });
  };

  const scrollDateIntoView = React.useCallback(
    (date: string) => {
      const index = dates.findIndex((candidate) => dateKey(candidate) === date);
      if (index < 0) return;
      const visibleWidth = Math.max(0, windowWidth - 40);
      const selectedCenter =
        index * (DATE_CARD_WIDTH + DATE_CARD_GAP) + DATE_CARD_WIDTH / 2;

      requestAnimationFrame(() => {
        dateScrollRef.current?.scrollTo({
          x: Math.max(0, selectedCenter - visibleWidth / 2),
          animated: true,
        });
      });
    },
    [dates, windowWidth],
  );

  React.useEffect(() => {
    scrollDateIntoView(activeDate);
  }, [activeDate, scrollDateIntoView]);

  const handleSelectSlot = (slot: AvailabilitySlot) => {
    const slotDate = format(parseISO(slot.starts_at), 'yyyy-MM-dd');
    setSelectedDate(slotDate);
    setSlot(slot);
    scrollDateIntoView(slotDate);
  };

  const goNext = () => {
    if (!selectedSlot) return;
    if (entryPoint === 'staff_first') {
      router.push('/booking/review');
      return;
    }
    if (selectedSlot.available_staff.length === 1) {
      setStaff(selectedSlot.available_staff[0]);
      router.push('/booking/review');
      return;
    }
    router.push('/booking/staff');
  };

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
          <View style={styles.header}>
            <View>
              <Typography variant="caption" style={styles.eyebrow}>
                {selectedServiceLabel}
              </Typography>
              <Typography
                variant="h2"
                style={[styles.title, { color: colors.text }]}
              >
                {t('booking.steps.slots')}
              </Typography>
            </View>
            <TouchableOpacity onPress={() => refetch()} style={styles.refresh}>
              <Typography variant="label" style={styles.refreshText}>
                {isFetching ? t('common.loading') : t('common.refresh')}
              </Typography>
            </TouchableOpacity>
          </View>

          {isRebookMode && (
            <View
              style={[
                styles.rebookBanner,
                {
                  backgroundColor: isDark ? '#18181b' : '#fffbeb',
                  borderColor: '#f59e0b',
                },
              ]}
            >
              <RotateCcw size={16} color="#f59e0b" />
              <Typography variant="label" style={styles.rebookText}>
                {t('booking.rebookingBanner', {
                  services:
                    selectedServiceLabel ||
                    rebookSource?.originalStaffName ||
                    t('booking.steps.services'),
                })}
              </Typography>
            </View>
          )}

          {entryPoint === 'staff_first' && (
            <View
              style={[
                styles.summaryRow,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.outlineVariant,
                },
              ]}
            >
              <Typography variant="caption" style={styles.summaryLabel}>
                {t('booking.selectedArtisan')}
              </Typography>
              {selectedStaffChoice === 'specific' && selectedStaff ? (
                <View style={styles.staffMini}>
                  <Image
                    source={{
                      uri:
                        selectedStaff.avatar ||
                        'https://images.unsplash.com/photo-1618077360395-f3068be8e001?w=200&h=200&fit=crop',
                    }}
                    style={styles.staffMiniAvatar}
                  />
                  <View style={styles.staffMiniInfo}>
                    <Typography
                      variant="label"
                      style={[styles.summaryValue, { color: colors.text }]}
                    >
                      {`${selectedStaff.first_name} ${selectedStaff.last_name}`}
                    </Typography>
                    {selectedStaff.specialty && (
                      <Typography
                        variant="caption"
                        style={{ color: colors.onSurfaceVariant }}
                      >
                        {selectedStaff.specialty}
                      </Typography>
                    )}
                    <View style={styles.staffMiniRating}>
                      <Star size={11} color="#f59e0b" fill="#f59e0b" />
                      <Typography
                        variant="caption"
                        style={[styles.ratingText, { color: colors.text }]}
                      >
                        {selectedStaff.avg_rating.toFixed(1)}
                      </Typography>
                      <Typography
                        variant="caption"
                        style={{ color: colors.onSurfaceVariant, fontSize: 10 }}
                      >
                        ({selectedStaff.review_count})
                      </Typography>
                    </View>
                  </View>
                </View>
              ) : (
                <Typography
                  variant="label"
                  style={[styles.summaryValue, { color: colors.text }]}
                >
                  {t('booking.anyStaff')}
                </Typography>
              )}
            </View>
          )}

          {data?.recommendations && data.recommendations.length > 0 && (
            <View style={styles.section}>
              <Typography
                variant="h3"
                style={[styles.sectionTitle, { color: colors.text }]}
              >
                {t('booking.recommendedSlots')}
              </Typography>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              >
                {data.recommendations.map((slot) => (
                  <TouchableOpacity
                    key={`${slot.starts_at}-${slot.label}`}
                    onPress={() => handleSelectSlot(slot)}
                    style={[
                      styles.recommendationCard,
                      {
                        backgroundColor: colors.card,
                        borderColor:
                          selectedSlot?.starts_at === slot.starts_at
                            ? '#f59e0b'
                            : colors.outlineVariant,
                      },
                    ]}
                  >
                    <Typography variant="caption" style={styles.recLabel}>
                      {getRecommendationLabel(slot.label, t).toUpperCase()}
                    </Typography>
                    <Typography
                      variant="h2"
                      style={[styles.recTime, { color: colors.text }]}
                    >
                      {format(parseISO(slot.starts_at), 'HH:mm')}
                    </Typography>
                    <Typography
                      variant="caption"
                      style={{ color: colors.onSurfaceVariant }}
                    >
                      {getRecommendationDateLabel(slot.starts_at)}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.section}>
            <Typography
              variant="h3"
              style={[styles.sectionTitle, { color: colors.text }]}
            >
              {format(parseISO(`${activeDate}T00:00:00`), 'MMMM yyyy', {
                locale: dateLocale,
              })}
            </Typography>
            <ScrollView
              ref={dateScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {dates.map((date) => {
                const key = dateKey(date);
                const isSelected = key === activeDate;
                const hasSlots = !!data?.days?.find(
                  (day) => day.date === key && day.slots.length > 0,
                );
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => {
                      setSelectedDate(key);
                      setSlot(null);
                      scrollDateIntoView(key);
                    }}
                    style={[
                      styles.dateCard,
                      {
                        backgroundColor: isSelected ? '#f59e0b' : colors.card,
                        borderColor: isSelected
                          ? '#f59e0b'
                          : colors.outlineVariant,
                        opacity: hasSlots || isLoading ? 1 : 0.45,
                      },
                    ]}
                  >
                    <Typography
                      variant="caption"
                      style={{
                        color: isSelected ? '#000' : colors.onSurfaceVariant,
                      }}
                    >
                      {format(date, 'EEE', { locale: dateLocale })}
                    </Typography>
                    <Typography
                      variant="h2"
                      style={[
                        styles.dateNumber,
                        { color: isSelected ? '#000' : colors.text },
                      ]}
                    >
                      {format(date, 'd')}
                    </Typography>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.slotsContainer}>
            {dayAvailability?.slots?.length ? (
              (['morning', 'afternoon', 'evening'] as const).map((period) => {
                const slots = groupedSlots[period];
                if (slots.length === 0) return null;
                return (
                  <View key={period} style={styles.timeOfDay}>
                    <Typography variant="caption" style={styles.timeOfDayTitle}>
                      {getPeriodLabel(period, t).toUpperCase()}
                    </Typography>
                    <View style={styles.grid}>
                      {slots.map((slot) => {
                        const isSelected =
                          selectedSlot?.starts_at === slot.starts_at;
                        return (
                          <TouchableOpacity
                            key={slot.starts_at}
                            onPress={() => handleSelectSlot(slot)}
                            style={[
                              styles.slotButton,
                              {
                                backgroundColor: isSelected
                                  ? isDark
                                    ? '#fff'
                                    : '#000'
                                  : colors.card,
                                borderColor: isSelected
                                  ? isDark
                                    ? '#fff'
                                    : '#000'
                                  : colors.outlineVariant,
                              },
                            ]}
                          >
                            <Typography
                              variant="label"
                              style={{
                                color: isSelected
                                  ? isDark
                                    ? '#000'
                                    : '#fff'
                                  : colors.text,
                              }}
                            >
                              {format(parseISO(slot.starts_at), 'HH:mm')}
                            </Typography>
                            <Typography
                              variant="caption"
                              style={{
                                color: isSelected
                                  ? isDark
                                    ? '#27272a'
                                    : '#e4e4e7'
                                  : colors.onSurfaceVariant,
                                fontSize: 10,
                              }}
                            >
                              {slot.available_staff.length}{' '}
                              {t('booking.availableStaffShort')}
                            </Typography>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })
            ) : (
              <View
                style={[
                  styles.emptyState,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.outlineVariant,
                  },
                ]}
              >
                <Typography
                  variant="h3"
                  style={[styles.emptyTitle, { color: colors.text }]}
                >
                  {t('booking.noSlotsAvailable')}
                </Typography>
                <Typography
                  variant="caption"
                  style={{
                    color: colors.onSurfaceVariant,
                    textAlign: 'center',
                  }}
                >
                  {t('booking.chooseAnotherDate')}
                </Typography>
              </View>
            )}
          </View>
        </ScrollView>
      </Screen>

      <BookingStickyFooter
        label={t('booking.selectedTime')}
        value={
          selectedSlot
            ? format(parseISO(selectedSlot.starts_at), 'EEE d MMM, HH:mm', {
                locale: dateLocale,
              })
            : t('booking.noSlotSelected')
        }
        buttonText={t('booking.continue')}
        onPress={goNext}
        disabled={!selectedSlot}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 150,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  eyebrow: { color: '#f59e0b', fontWeight: '800', marginBottom: 4 },
  title: { fontSize: 24, fontWeight: '900' },
  refresh: { paddingHorizontal: 12, paddingVertical: 8 },
  refreshText: { color: '#f59e0b', fontWeight: '900' },
  rebookBanner: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rebookText: { color: '#f59e0b', fontWeight: '900', flex: 1 },
  summaryRow: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 4,
  },
  summaryLabel: {
    color: '#71717a',
    fontWeight: '900',
    textTransform: 'uppercase',
    fontSize: 10,
  },
  summaryValue: { fontWeight: '900' },
  section: { marginTop: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 12 },
  horizontalList: { gap: 10, paddingRight: 20 },
  recommendationCard: {
    width: 120,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  recLabel: { color: '#f59e0b', fontWeight: '900', fontSize: 10 },
  recTime: { fontSize: 22, fontWeight: '900', marginVertical: 6 },
  dateCard: {
    width: 64,
    height: 78,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNumber: { fontSize: 24, fontWeight: '900', marginTop: 4 },
  slotsContainer: { marginTop: 28 },
  timeOfDay: { marginBottom: 24 },
  timeOfDayTitle: { color: '#71717a', fontWeight: '900', marginBottom: 12 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotButton: {
    width: '30%',
    minWidth: 96,
    height: 58,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: { fontWeight: '900', textAlign: 'center' },
  staffMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  staffMiniAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  staffMiniInfo: {
    flex: 1,
    gap: 2,
  },
  staffMiniRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontWeight: '700',
    fontSize: 11,
  },
});
