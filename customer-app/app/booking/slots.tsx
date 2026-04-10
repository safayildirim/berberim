import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RotateCcw } from 'lucide-react-native';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';
import { useBookingStore } from '@/src/store/useBookingStore';
import {
  useAvailabilitySearch,
  useSlotRecommendations,
} from '@/src/hooks/queries/useAvailability';
import { useTenantStore } from '@/src/store/useTenantStore';
import { BookingStickyFooter } from '@/src/components/booking/BookingStickyFooter';
import { format, parseISO, addDays, startOfDay, isSameDay } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { Screen } from '@/src/components/common/Screen';

export default function BookingSlotsScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { config } = useTenantStore();
  const {
    selectedSlot,
    setSlot,
    selectedServices,
    selectedStaff,
    isRebookMode,
  } = useBookingStore();

  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));

  const dates = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => addDays(startOfDay(new Date()), i)),
    [],
  );

  const dateLocale = i18n.language.startsWith('tr') ? tr : enUS;

  const {
    data: slots,
    isLoading,
    error,
  } = useAvailabilitySearch({
    date: format(selectedDate, 'yyyy-MM-dd'),
    service_ids: selectedServices.map((s) => s.id),
    staff_user_id: selectedStaff?.id,
    tenant_id: config?.id as string,
  });

  const { data: recommendations } = useSlotRecommendations({
    service_ids: selectedServices.map((s) => s.id),
    staff_user_id: selectedStaff?.id,
  });

  const groupedSlots = useMemo(() => {
    if (!slots) return { morning: [], afternoon: [], evening: [] };
    const all = [
      ...(slots.slots || []).map((s) => ({ ...s, available: true })),
      ...(slots.filled_slots || []).map((s) => ({ ...s, available: false })),
    ];
    all.sort(
      (a, b) =>
        parseISO(a.starts_at).getTime() - parseISO(b.starts_at).getTime(),
    );

    return all.reduce(
      (acc: any, slot: any) => {
        const hour = parseISO(slot.starts_at).getHours();
        if (hour < 12) acc.morning.push(slot);
        else if (hour < 17) acc.afternoon.push(slot);
        else acc.evening.push(slot);
        return acc;
      },
      { morning: [], afternoon: [], evening: [] },
    );
  }, [slots]);

  const serviceNameText =
    selectedServices.length > 0
      ? `${selectedServices[0].name}${selectedServices.length > 1 ? ` +${selectedServices.length - 1}` : ''}`
      : 'Select Service';

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
          {isRebookMode && (
            <View
              style={[
                styles.rebookBanner,
                {
                  backgroundColor: isDark
                    ? 'rgba(245, 158, 11, 0.1)'
                    : '#fffbeb',
                  borderColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7',
                },
              ]}
            >
              <RotateCcw size={16} color="#d97706" />
              <Typography
                variant="label"
                style={{ color: '#d97706', fontWeight: '800' }}
              >
                {t('booking.rebookingBanner', { services: serviceNameText })}
              </Typography>
            </View>
          )}

          {/* Selection Summary */}
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            <View style={styles.summaryItem}>
              <Typography variant="caption" style={styles.summaryLabel}>
                {t('booking.selectedArtisan')}
              </Typography>
              <Typography
                variant="h3"
                style={[styles.summaryValue, { color: colors.text }]}
              >
                {serviceNameText}
              </Typography>
            </View>
            <View
              style={[
                styles.divider,
                { backgroundColor: colors.outlineVariant },
              ]}
            />
            <View style={[styles.summaryItem, { alignItems: 'flex-end' }]}>
              <Typography variant="caption" style={styles.summaryLabel}>
                {t('booking.steps.staff')}
              </Typography>
              <Typography
                variant="h3"
                style={[styles.summaryValue, { color: colors.text }]}
              >
                {selectedStaff
                  ? `${selectedStaff.first_name}`
                  : t('booking.anyStaff')}
              </Typography>
            </View>
          </View>

          {/* Recommendations */}
          {recommendations && recommendations.length > 0 && (
            <View style={styles.section}>
              <Typography
                variant="h2"
                style={[styles.sectionTitle, { color: colors.text }]}
              >
                {t('booking.recommendedSlots')}
              </Typography>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              >
                {recommendations.map((rec, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      setSelectedDate(startOfDay(parseISO(rec.starts_at)));
                      setSlot(rec);
                    }}
                    style={[
                      styles.recCard,
                      {
                        backgroundColor: colors.card,
                        borderColor:
                          selectedSlot?.starts_at === rec.starts_at
                            ? '#f59e0b'
                            : colors.outlineVariant,
                      },
                    ]}
                  >
                    <Typography variant="caption" style={styles.recLabel}>
                      {rec.label.toUpperCase()}
                    </Typography>
                    <Typography
                      variant="h2"
                      style={[styles.recTime, { color: colors.text }]}
                    >
                      {format(parseISO(rec.starts_at), 'HH:mm')}
                    </Typography>
                    <Typography
                      variant="caption"
                      style={{ color: colors.onSurfaceVariant }}
                    >
                      {isToday(parseISO(rec.starts_at))
                        ? t('booking.today')
                        : t('booking.tomorrow')}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Date Picker */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Typography
                variant="h2"
                style={[styles.sectionTitle, { color: colors.text }]}
              >
                {format(selectedDate, 'MMMM yyyy', { locale: dateLocale })}
              </Typography>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {dates.map((date, i) => {
                const isSelected = isSameDay(date, selectedDate);
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setSelectedDate(date)}
                    style={[
                      styles.dateCard,
                      {
                        backgroundColor: isSelected ? '#f59e0b' : colors.card,
                        borderColor: isSelected
                          ? '#f59e0b'
                          : colors.outlineVariant,
                      },
                    ]}
                  >
                    <Typography
                      variant="caption"
                      style={[
                        styles.dayName,
                        {
                          color: isSelected ? '#000' : colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      {format(date, 'EEE', { locale: dateLocale })}
                    </Typography>
                    <Typography
                      variant="h2"
                      style={[
                        styles.dayNumber,
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

          {/* Time Grid */}
          <View style={styles.slotsContainer}>
            {Object.entries(groupedSlots).map(([title, slots]) => (
              <View key={title} style={styles.timeOfDay}>
                <Typography variant="caption" style={styles.timeOfDayTitle}>
                  {title.toUpperCase()}
                </Typography>
                <View style={styles.grid}>
                  {(slots as any[]).map((slot, i) => {
                    const isSelected =
                      selectedSlot?.starts_at === slot.starts_at;
                    return (
                      <TouchableOpacity
                        key={i}
                        disabled={!slot.available}
                        onPress={() => setSlot(slot)}
                        style={[
                          styles.slotButton,
                          {
                            backgroundColor: !slot.available
                              ? isDark
                                ? 'rgba(255,255,255,0.02)'
                                : '#fafafa'
                              : isSelected
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
                          style={[
                            styles.slotText,
                            {
                              color: !slot.available
                                ? isDark
                                  ? '#27272a'
                                  : '#d4d4d8'
                                : isSelected
                                  ? isDark
                                    ? '#000'
                                    : '#fff'
                                  : colors.text,
                              textDecorationLine: slot.available
                                ? 'none'
                                : 'line-through',
                            },
                          ]}
                        >
                          {format(parseISO(slot.starts_at), 'HH:mm')}
                        </Typography>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </Screen>

      <BookingStickyFooter
        label={t('booking.timeLabel')}
        value={
          selectedSlot
            ? `${format(parseISO(selectedSlot.starts_at), 'EEE, MMM d, HH:mm', { locale: dateLocale })}`
            : t('booking.noSlotSelected')
        }
        buttonText={t('booking.confirm')}
        onPress={() =>
          router.push(isRebookMode ? '/booking/review' : '/booking/staff')
        }
        disabled={!selectedSlot}
      />
    </View>
  );
}

const isToday = (date: Date) => isSameDay(date, new Date());

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: 160 },
  rebookBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 20,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  summaryItem: { flex: 1 },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#71717a',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryValue: { fontSize: 14, fontWeight: '700' },
  divider: { width: 1, height: 32, marginHorizontal: 16 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 20,
  },
  horizontalList: { paddingHorizontal: 20, gap: 12 },
  recCard: {
    width: 140,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  recLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f59e0b',
    marginBottom: 8,
  },
  recTime: { fontSize: 20, fontWeight: '900' },
  dateCard: {
    width: 60,
    height: 72,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayName: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  dayNumber: { fontSize: 18, fontWeight: '900', marginTop: 2 },
  slotsContainer: { paddingHorizontal: 20 },
  timeOfDay: { marginBottom: 24 },
  timeOfDayTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#71717a',
    marginBottom: 12,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotButton: {
    width: '23%',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  slotText: { fontSize: 14, fontWeight: '800' },
});
