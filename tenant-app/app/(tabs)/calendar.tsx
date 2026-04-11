import {
  addDays,
  differenceInMinutes,
  format,
  isSameDay,
  parseISO,
  startOfToday,
  subDays,
} from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Screen } from '@/src/components/common/Screen';
import { SHADOWS } from '@/src/constants/theme';
import { useAppointments } from '@/src/hooks/queries/useAppointments';
import { useStaffMutations } from '@/src/hooks/mutations/useStaffMutations';
import {
  useStaffSchedule,
  useStaffTimeOff,
} from '@/src/hooks/queries/useStaff';
import { useSessionStore } from '@/src/store/useSessionStore';
import { TimeOff } from '@/src/types';
import { toLocalRFC3339 } from '@/src/utils/datetime';
import { useTheme } from '@/src/hooks/useTheme';

const HOUR_HEIGHT = 96;
const TIME_COLUMN_WIDTH = 70;

const END_TIME_OFFSETS = [15, 30, 45, 60, 75, 90, 105, 120];

const addMinutesToTime = (time: string, minutes: number): string => {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

export default function CalendarScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { tenant, user: staffUser } = useSessionStore();
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const flatListRef = useRef<FlatList>(null);

  const dateLocale = i18n.language.startsWith('tr') ? tr : enUS;

  const dates = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) =>
        addDays(subDays(startOfToday(), 7), i),
      ),
    [],
  );

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

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const {
    data: appointmentsData,
    isLoading: isLoadingAppointments,
    refetch: refetchAppointments,
  } = useAppointments({
    date: dateStr,
  });

  const appointments = appointmentsData || [];

  const {
    data: timeOffsData,
    isLoading: isLoadingTimeOffs,
    refetch: refetchTimeOffs,
  } = useStaffTimeOff(staffUser?.id || '');

  const handleRefresh = async () => {
    await Promise.all([refetchAppointments(), refetchTimeOffs()]);
  };

  const dailyTimeOffs = useMemo(() => {
    if (!timeOffsData) return [];
    return timeOffsData.filter((to) =>
      isSameDay(parseISO(to.start_at), selectedDate),
    );
  }, [timeOffsData, selectedDate]);

  const { data: scheduleRules } = useStaffSchedule(staffUser?.id || '');

  // day_of_week uses 0=Sunday…6=Saturday, same as JS Date.getDay()
  const todayRule = scheduleRules?.find(
    (r) => r.day_of_week === selectedDate.getDay() && r.is_working_day,
  );

  // Schedule times are stored as UTC; shift to local for display
  const utcOffsetHours = -new Date().getTimezoneOffset() / 60;
  const calendarStartHour = todayRule
    ? parseInt(todayRule.start_time.split(':')[0], 10) + utcOffsetHours
    : 8;
  const calendarEndHour = todayRule
    ? parseInt(todayRule.end_time.split(':')[0], 10) + utcOffsetHours
    : 23;

  const timeSlots = useMemo(() => {
    return Array.from(
      { length: calendarEndHour - calendarStartHour + 1 },
      (_, i) => `${String(calendarStartHour + i).padStart(2, '0')}:00`,
    );
  }, [calendarStartHour, calendarEndHour]);

  const handlePrevDay = () => {
    setSelectedDate((prev) => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => addDays(prev, 1));
  };

  const [durationPicker, setDurationPicker] = useState<{
    startTime: string;
    endTime: string;
    mode: 'appointment' | 'timeOff';
    type?: 'leave' | 'holiday' | 'closure';
    reason?: string;
  } | null>(null);
  const [slotActionPicker, setSlotActionPicker] = useState<string | null>(null);

  const { addTimeOff } = useStaffMutations();

  const handleTimeSlotLongPress = (time: string) => {
    setSlotActionPicker(time);
  };

  const handleCreateAppointment = () => {
    if (!slotActionPicker) return;
    const time = slotActionPicker;
    setSlotActionPicker(null);
    setDurationPicker({
      startTime: time,
      endTime: addMinutesToTime(time, 30),
      mode: 'appointment',
    });
  };

  const handleAddTimeOff = () => {
    if (!slotActionPicker) return;
    const time = slotActionPicker;
    setSlotActionPicker(null);
    setDurationPicker({
      startTime: time,
      endTime: addMinutesToTime(time, 30),
      mode: 'timeOff',
      type: 'leave',
      reason: '',
    });
  };

  const handleEndTimeSelect = (endTime: string) => {
    setDurationPicker((prev) => (prev ? { ...prev, endTime } : null));
  };

  const handleConfirmEndTime = async () => {
    if (!durationPicker) return;
    const { startTime, endTime, mode } = durationPicker;
    const datePart = format(selectedDate, 'yyyy-MM-dd');

    if (mode === 'timeOff') {
      if (!staffUser?.id) return;
      try {
        await addTimeOff.mutateAsync({
          staffId: staffUser.id,
          data: {
            start_at: toLocalRFC3339(datePart, startTime),
            end_at: toLocalRFC3339(datePart, endTime),
            type: durationPicker.type || 'leave',
            reason: durationPicker.reason || 'Added from calendar',
          },
        });
        setDurationPicker(null);
        Alert.alert(t('common.success'), t('calendar.timeOffCreated'));
      } catch (err) {
        console.error(err);
        Alert.alert(t('common.error'), t('calendar.timeOffError'));
      }
      return;
    }

    setDurationPicker(null);
    router.push({
      pathname: '/appointments/create',
      params: {
        date: datePart,
        time: startTime,
        endTime,
      },
    } as any);
  };

  const handleDurationCancel = () => setDurationPicker(null);

  const DateItem = ({ date }: { date: Date }) => {
    const isSelected = isSameDay(date, selectedDate);
    const dayName = format(date, 'eee', { locale: dateLocale });
    const dayNumber = format(date, 'd', { locale: dateLocale });

    return (
      <TouchableOpacity
        style={[
          styles.dateCard,
          isSelected
            ? { backgroundColor: colors.primary }
            : { backgroundColor: colors.surfaceContainerLow },
          isSelected && SHADOWS.md,
        ]}
        onPress={() => setSelectedDate(date)}
      >
        <Text
          style={[
            styles.dateDayName,
            { color: isSelected ? colors.onPrimary : colors.secondary },
          ]}
        >
          {dayName.toUpperCase()}
        </Text>
        <Text
          style={[
            styles.dateDayNumber,
            { color: isSelected ? colors.onPrimary : colors.primary },
          ]}
        >
          {dayNumber}
        </Text>
      </TouchableOpacity>
    );
  };

  const TimeOffBlock = ({ timeOff }: { timeOff: TimeOff }) => {
    const start = parseISO(timeOff.start_at);
    const end = parseISO(timeOff.end_at);
    const duration = differenceInMinutes(end, start);

    const startHour = start.getHours();
    const startMin = start.getMinutes();
    const top =
      (startHour - calendarStartHour) * HOUR_HEIGHT +
      (startMin / 60) * HOUR_HEIGHT;
    const height = (duration / 60) * HOUR_HEIGHT - 8;

    const typeColors: any = {
      leave: isDark
        ? { bg: '#332b00', text: '#ffe082', border: '#ffe082' }
        : { bg: '#FEF3C7', text: '#D97706', border: '#FCD34D' },
      holiday: isDark
        ? { bg: '#2d164d', text: '#e1d5e7', border: '#e1d5e7' }
        : { bg: '#F3E8FF', text: '#7E22CE', border: '#E9D5FF' },
      closure: isDark
        ? { bg: '#3e0000', text: '#ffb4ab', border: '#ffb4ab' }
        : { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' },
    };

    const config = typeColors[timeOff.type] || typeColors.leave;

    return (
      <View
        style={[
          styles.appointmentItem,
          {
            top: top + 8,
            height,
            backgroundColor: config.bg,
            borderColor: config.border,
            borderWidth: 1,
            zIndex: 10,
          },
        ]}
      >
        <View style={[styles.statusLine, { backgroundColor: config.text }]} />
        <View style={styles.appointmentBody}>
          <Text
            style={[styles.clientName, { color: config.text }]}
            numberOfLines={1}
          >
            {t(
              `calendar.type${timeOff.type[0].toUpperCase()}${timeOff.type.slice(1)}`,
            ).toUpperCase()}
          </Text>
          <Text
            style={[styles.serviceText, { color: config.text, opacity: 0.8 }]}
            numberOfLines={2}
          >
            {timeOff.reason}
          </Text>
        </View>
      </View>
    );
  };

  const AppointmentBlock = ({ appointment }: { appointment: any }) => {
    const start = parseISO(appointment.starts_at);
    const end = parseISO(appointment.ends_at);
    const duration = differenceInMinutes(end, start);

    // Calculate position
    const startHour = start.getHours();
    const startMin = start.getMinutes();

    const top =
      (startHour - calendarStartHour) * HOUR_HEIGHT +
      (startMin / 60) * HOUR_HEIGHT;
    const height = (duration / 60) * HOUR_HEIGHT - 8; // -8 for spacing

    const statusConfig: any = {
      confirmed: {
        bg: colors.success + '15',
        text: colors.success,
        border: colors.success,
      },
      pending: {
        bg: colors.pending + '15',
        text: colors.pending,
        border: colors.pending,
      },
      completed: {
        bg: colors.completed + '15',
        text: colors.completed,
        border: colors.completed,
      },
      cancelled: {
        bg: colors.cancelled + '15',
        text: colors.cancelled,
        border: colors.cancelled,
      },
      no_show: {
        bg: colors.no_show + '15',
        text: colors.no_show,
        border: colors.no_show,
      },
    };

    const config = statusConfig[appointment.status] || statusConfig.confirmed;

    return (
      <TouchableOpacity
        style={[
          styles.appointmentItem,
          {
            backgroundColor: colors.surfaceContainerLowest,
            borderColor: colors.border + '30',
          },
          { top: top + 8, height },
          SHADOWS.sm,
        ]}
        onPress={() =>
          router.push({
            pathname: '/appointments/[id]',
            params: { id: appointment.id },
          } as any)
        }
      >
        <View
          style={[
            styles.statusLine,
            {
              backgroundColor:
                config.border === colors.success
                  ? colors.success
                  : colors.primary,
            },
          ]}
        />
        <View style={styles.appointmentBody}>
          <View style={styles.appointmentHeader}>
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.clientName, { color: colors.primary }]}
                numberOfLines={1}
              >
                {appointment.customer?.first_name}{' '}
                {appointment.customer?.last_name}
              </Text>
              <Text
                style={[styles.serviceText, { color: colors.secondary }]}
                numberOfLines={1}
              >
                {appointment.services?.[0]?.service_name || 'Service'}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
              <Text style={[styles.statusBadgeText, { color: config.text }]}>
                {t(`appointments.status.${appointment.status}`).toUpperCase()}
              </Text>
            </View>
          </View>

          {height > 80 && (
            <View style={styles.appointmentFooter}>
              <View style={styles.timeInfo}>
                <Clock size={12} color={colors.secondary} />
                <Text
                  style={[styles.timeRangeText, { color: colors.secondary }]}
                >
                  {format(start, 'HH:mm', { locale: dateLocale })} -{' '}
                  {format(end, 'HH:mm', { locale: dateLocale })}
                </Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Screen
      style={[styles.container, { backgroundColor: colors.background }]}
      withPadding={false}
      transparentStatusBar
      headerTitle={tenant?.name}
      headerSubtitle={t('nav.calendar')}
      showNotification
    >
      {/* Sticky Header Section */}
      <View
        style={[
          styles.stickyHeader,
          { backgroundColor: colors.background + 'F2' },
        ]}
      >
        <View style={styles.calendarHeader}>
          <View style={styles.headerTitle}>
            <Text style={[styles.headerTitleText, { color: colors.primary }]}>
              {t('calendar.schedule')}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.secondary }]}>
              {format(selectedDate, 'MMMM yyyy', {
                locale: dateLocale,
              }).toUpperCase()}
            </Text>
          </View>
          <View style={styles.calendarNav}>
            <TouchableOpacity
              onPress={handlePrevDay}
              style={[
                styles.navButton,
                { backgroundColor: colors.primary + '10' },
                isSameDay(selectedDate, dates[0]) && { opacity: 0.3 },
              ]}
              disabled={isSameDay(selectedDate, dates[0])}
            >
              <ChevronLeft size={16} color={colors.secondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleNextDay}
              style={[
                styles.navButton,
                { backgroundColor: colors.primary + '10' },
                isSameDay(selectedDate, dates[dates.length - 1]) && {
                  opacity: 0.3,
                },
              ]}
              disabled={isSameDay(selectedDate, dates[dates.length - 1])}
            >
              <ChevronRight size={16} color={colors.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Horizontal Date Selector */}
        <FlatList
          ref={flatListRef}
          data={dates}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateStrip}
          keyExtractor={(item) => item.toISOString()}
          getItemLayout={(_, index) => ({
            length: 64 + 12, // width + gap
            offset: (64 + 12) * index,
            index,
          })}
          renderItem={({ item }) => <DateItem date={item} />}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingAppointments || isLoadingTimeOffs}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Calendar Grid Section */}
        <View style={styles.gridContainer}>
          {/* Vertical Timeline Line */}
          <View
            style={[
              styles.timelineLine,
              { backgroundColor: colors.border + '30' },
            ]}
          />

          {/* Time Slots */}
          <View style={styles.timeSlotsColumn}>
            {timeSlots.map((time) => (
              <Pressable
                key={time}
                style={({ pressed }) => [
                  styles.timeSlotRow,
                  pressed && { backgroundColor: colors.primary + '0A' },
                ]}
                onLongPress={() => handleTimeSlotLongPress(time)}
                delayLongPress={400}
              >
                <Text
                  style={[styles.timeSlotLabel, { color: colors.secondary }]}
                >
                  {time}
                </Text>
                <View
                  style={[
                    styles.slotBorder,
                    { borderColor: colors.border + '20' },
                  ]}
                />
              </Pressable>
            ))}
          </View>

          {/* Appointments Overlay */}
          <View style={styles.appointmentsLayer}>
            {appointments.map((appt: any) => (
              <AppointmentBlock key={appt.id} appointment={appt} />
            ))}

            {dailyTimeOffs.map((to) => (
              <TimeOffBlock key={to.id} timeOff={to} />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Slot Action Picker Modal */}
      <Modal
        visible={!!slotActionPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setSlotActionPicker(null)}
      >
        <TouchableOpacity
          style={styles.durationBackdrop}
          activeOpacity={1}
          onPress={() => setSlotActionPicker(null)}
        >
          <View style={[styles.actionSheet, { backgroundColor: colors.card }]}>
            <View
              style={[
                styles.durationHandle,
                { backgroundColor: colors.surfaceContainerHighest },
              ]}
            />
            <Text style={[styles.actionSheetTitle, { color: colors.primary }]}>
              {slotActionPicker} •{' '}
              {format(selectedDate, 'MMM d', { locale: dateLocale })}
            </Text>
            <Text
              style={[styles.actionSheetSubtitle, { color: colors.secondary }]}
            >
              {t('calendar.selectAction')}
            </Text>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.surfaceContainerLow },
                ]}
                onPress={handleCreateAppointment}
              >
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: colors.primary + '20' },
                  ]}
                >
                  <Plus size={24} color={colors.primary} />
                </View>
                <Text
                  style={[styles.actionButtonText, { color: colors.primary }]}
                >
                  {t('calendar.createAppointment')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.surfaceContainerLow },
                ]}
                onPress={handleAddTimeOff}
              >
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: colors.pending + '20' },
                  ]}
                >
                  <Clock size={24} color={colors.pending} />
                </View>
                <Text
                  style={[styles.actionButtonText, { color: colors.primary }]}
                >
                  {t('calendar.addTimeOff')}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.actionCancelBtn}
              onPress={() => setSlotActionPicker(null)}
            >
              <Text
                style={[styles.actionCancelText, { color: colors.outline }]}
              >
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* End Time Picker */}
      <Modal
        visible={!!durationPicker}
        transparent
        animationType="slide"
        onRequestClose={handleDurationCancel}
      >
        <TouchableOpacity
          style={styles.durationBackdrop}
          activeOpacity={1}
          onPress={handleDurationCancel}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.durationSheet, { backgroundColor: colors.card }]}
          >
            <View
              style={[
                styles.durationHandle,
                { backgroundColor: colors.surfaceContainerHighest },
              ]}
            />

            <View style={styles.durationHeader}>
              <Text
                style={[styles.durationSheetTitle, { color: colors.primary }]}
              >
                {durationPicker?.startTime} → {durationPicker?.endTime}
              </Text>
              <Text
                style={[
                  styles.durationSheetSubtitle,
                  { color: colors.secondary },
                ]}
              >
                {format(selectedDate, 'EEEE, MMMM d, yyyy', {
                  locale: dateLocale,
                })}
              </Text>
            </View>

            <Text
              style={[styles.durationChipsLabel, { color: colors.secondary }]}
            >
              {t('calendar.selectEndTime')}
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.durationChipsContent}
              style={styles.durationChipsScroll}
            >
              {END_TIME_OFFSETS.map((offset) => {
                const endTime = addMinutesToTime(
                  durationPicker?.startTime ?? '',
                  offset,
                );
                const isActive = durationPicker?.endTime === endTime;
                return (
                  <TouchableOpacity
                    key={offset}
                    style={[
                      styles.durationChip,
                      { backgroundColor: colors.surfaceContainerLow },
                      isActive && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => handleEndTimeSelect(endTime)}
                  >
                    <Text
                      style={[
                        styles.durationChipTime,
                        { color: colors.primary },
                        isActive && { color: colors.onPrimary },
                      ]}
                    >
                      {endTime}
                    </Text>
                    <Text
                      style={[
                        styles.durationChipDuration,
                        { color: colors.secondary },
                        isActive && { color: colors.onPrimary },
                      ]}
                    >
                      {(() => {
                        if (offset < 60) {
                          return t('calendar.duration_min', {
                            minutes: offset,
                          });
                        }
                        const h = Math.floor(offset / 60);
                        const m = offset % 60;
                        if (m === 0) {
                          return t('calendar.duration_hr', { hours: h });
                        }
                        return t('calendar.duration_hr_min', {
                          hours: h,
                          minutes: m,
                        });
                      })()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {durationPicker?.mode === 'timeOff' && (
              <View style={styles.timeOffFields}>
                <Text style={[styles.fieldLabel, { color: colors.secondary }]}>
                  {t('calendar.timeOffType')}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.typeSelector}
                  contentContainerStyle={styles.typeSelectorContent}
                >
                  {(['leave', 'holiday', 'closure'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeChip,
                        {
                          backgroundColor: colors.surfaceContainerLow,
                          borderColor: colors.outlineVariant,
                        },
                        durationPicker.type === type && {
                          backgroundColor: colors.primary,
                          borderColor: colors.primary,
                        },
                      ]}
                      onPress={() =>
                        setDurationPicker((p) => (p ? { ...p, type } : null))
                      }
                    >
                      <Text
                        style={[
                          styles.typeChipText,
                          { color: colors.primary },
                          durationPicker.type === type && {
                            color: colors.onPrimary,
                          },
                        ]}
                      >
                        {t(
                          `calendar.type${type[0].toUpperCase()}${type.slice(1)}`,
                        )}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={[styles.fieldLabel, { color: colors.secondary }]}>
                  {t('calendar.timeOffReason')}
                </Text>
                <TextInput
                  style={[
                    styles.reasonInput,
                    {
                      backgroundColor: colors.surfaceContainerLow,
                      color: colors.primary,
                    },
                  ]}
                  placeholder={t('calendar.timeOffReason')}
                  placeholderTextColor={colors.outline}
                  value={durationPicker.reason}
                  onChangeText={(reason) =>
                    setDurationPicker((p) => (p ? { ...p, reason } : null))
                  }
                  multiline
                  numberOfLines={2}
                />
              </View>
            )}

            <View style={styles.durationActions}>
              <TouchableOpacity
                style={[
                  styles.durationCancelBtn,
                  { backgroundColor: colors.surfaceContainerHigh },
                ]}
                onPress={handleDurationCancel}
              >
                <Text
                  style={[styles.durationCancelText, { color: colors.primary }]}
                >
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.durationConfirmBtn,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleConfirmEndTime}
              >
                <Text
                  style={[
                    styles.durationConfirmText,
                    { color: colors.onPrimary },
                  ]}
                >
                  {durationPicker?.mode === 'timeOff'
                    ? t('common.approve')
                    : t('calendar.confirmTime')}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  stickyHeader: {
    paddingBottom: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  calendarNav: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    gap: 12,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    paddingHorizontal: 24,
    paddingTop: 24,
    marginBottom: 8,
  },
  headerTitleText: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  dateStrip: {
    paddingHorizontal: 12,
    gap: 12,
    paddingBottom: 12,
  },
  dateCard: {
    width: 64,
    height: 96,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  dateDayName: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dateDayNumber: {
    fontSize: 20,
    fontWeight: '800',
  },
  gridContainer: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  timelineLine: {
    position: 'absolute',
    left: TIME_COLUMN_WIDTH + 24,
    top: 0,
    bottom: 0,
    width: 1,
  },
  timeSlotsColumn: {
    gap: 0,
  },
  timeSlotRow: {
    height: HOUR_HEIGHT,
    flexDirection: 'row',
  },
  timeSlotLabel: {
    width: TIME_COLUMN_WIDTH,
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'right',
    paddingRight: 16,
    top: -8,
  },
  slotBorder: {
    flex: 1,
    borderTopWidth: 1,
  },
  appointmentsLayer: {
    position: 'absolute',
    left: TIME_COLUMN_WIDTH + 24,
    right: 24,
    top: 0,
    height: '100%',
  },
  appointmentItem: {
    position: 'absolute',
    left: 8,
    right: 0,
    borderRadius: 8,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
  },
  statusLine: {
    width: 4,
  },
  appointmentBody: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  clientName: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  serviceText: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  appointmentFooter: {
    marginTop: 8,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeRangeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  durationBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5,17,37,0.5)',
    justifyContent: 'flex-end',
  },
  durationSheet: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 16,
    paddingBottom: 48,
  },
  durationHandle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 24,
  },
  durationHeader: {
    alignItems: 'center',
    paddingHorizontal: 32,
    marginBottom: 28,
  },
  durationSheetTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  durationSheetSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  durationChipsLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 16,
  },
  durationChipsScroll: {
    marginBottom: 28,
  },
  durationChipsContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  durationChip: {
    minWidth: 90,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  durationChipTime: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 2,
  },
  durationChipDuration: {
    fontSize: 10,
    fontWeight: '600',
  },
  durationActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
  },
  durationCancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  durationCancelText: {
    fontSize: 15,
    fontWeight: '700',
  },
  durationConfirmBtn: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  durationConfirmText: {
    fontSize: 15,
    fontWeight: '700',
  },
  actionSheet: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 16,
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  actionSheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSheetSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: 0.5,
  },
  actionButtons: {
    gap: 16,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    gap: 16,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
  actionCancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionCancelText: {
    fontSize: 15,
    fontWeight: '700',
  },
  timeOffFields: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  typeSelector: {
    marginBottom: 16,
  },
  typeSelectorContent: {
    gap: 8,
  },
  typeChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reasonInput: {
    borderRadius: 16,
    padding: 12,
    fontSize: 15,
    minHeight: 60,
    textAlignVertical: 'top',
  },
});
