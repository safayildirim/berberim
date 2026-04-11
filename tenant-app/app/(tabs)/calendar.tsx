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
import { COLORS, SHADOWS } from '@/src/constants/theme';
import { useAppointments } from '@/src/hooks/queries/useAppointments';
import { useStaffMutations } from '@/src/hooks/mutations/useStaffMutations';
import {
  useStaffSchedule,
  useStaffTimeOff,
} from '@/src/hooks/queries/useStaff';
import { useSessionStore } from '@/src/store/useSessionStore';
import { TimeOff } from '@/src/types';
import { toLocalRFC3339 } from '@/src/utils/datetime';

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
          isSelected ? styles.dateCardActive : styles.dateCardInactive,
          isSelected && SHADOWS.md,
        ]}
        onPress={() => setSelectedDate(date)}
      >
        <Text style={[styles.dateDayName, isSelected && styles.textWhite]}>
          {dayName.toUpperCase()}
        </Text>
        <Text style={[styles.dateDayNumber, isSelected && styles.textWhite]}>
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

    const colors: any = {
      leave: { bg: '#FEF3C7', text: '#D97706', border: '#FCD34D' },
      holiday: { bg: '#F3E8FF', text: '#7E22CE', border: '#E9D5FF' },
      closure: { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' },
    };

    const config = colors[timeOff.type] || colors.leave;

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
        bg: COLORS.success + '15',
        text: COLORS.success,
        border: COLORS.success,
      },
      pending: {
        bg: COLORS.pending + '15',
        text: COLORS.pending,
        border: COLORS.pending,
      },
      completed: {
        bg: COLORS.completed + '15',
        text: COLORS.completed,
        border: COLORS.completed,
      },
      cancelled: {
        bg: COLORS.cancelled + '15',
        text: COLORS.cancelled,
        border: COLORS.cancelled,
      },
      no_show: {
        bg: COLORS.no_show + '15',
        text: COLORS.no_show,
        border: COLORS.no_show,
      },
    };

    const config = statusConfig[appointment.status] || statusConfig.confirmed;

    return (
      <TouchableOpacity
        style={[styles.appointmentItem, { top: top + 8, height }, SHADOWS.sm]}
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
                config.border === COLORS.success
                  ? COLORS.success
                  : COLORS.primary,
            },
          ]}
        />
        <View style={styles.appointmentBody}>
          <View style={styles.appointmentHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName} numberOfLines={1}>
                {appointment.customer?.first_name}{' '}
                {appointment.customer?.last_name}
              </Text>
              <Text style={styles.serviceText} numberOfLines={1}>
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
                <Clock size={12} color={COLORS.secondary} />
                <Text style={styles.timeRangeText}>
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
      style={styles.container}
      withPadding={false}
      transparentStatusBar
      headerTitle={tenant?.name}
      headerSubtitle={t('nav.calendar')}
      showNotification
    >
      {/* Sticky Header Section */}
      <View style={styles.stickyHeader}>
        <View style={styles.calendarHeader}>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>{t('calendar.schedule')}</Text>
            <Text style={styles.headerSubtitle}>
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
                isSameDay(selectedDate, dates[0]) && { opacity: 0.3 },
              ]}
              disabled={isSameDay(selectedDate, dates[0])}
            >
              <ChevronLeft size={16} color={COLORS.secondary} />
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
              <ChevronRight size={16} color={COLORS.secondary} />
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
          />
        }
      >
        {/* Calendar Grid Section */}
        <View style={styles.gridContainer}>
          {/* Vertical Timeline Line */}
          <View style={styles.timelineLine} />

          {/* Time Slots */}
          <View style={styles.timeSlotsColumn}>
            {timeSlots.map((time) => (
              <Pressable
                key={time}
                style={({ pressed }) => [
                  styles.timeSlotRow,
                  pressed && styles.timeSlotRowPressed,
                ]}
                onLongPress={() => handleTimeSlotLongPress(time)}
                delayLongPress={400}
              >
                <Text style={styles.timeSlotLabel}>{time}</Text>
                <View style={styles.slotBorder} />
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
          <View style={styles.actionSheet}>
            <View style={styles.durationHandle} />
            <Text style={styles.actionSheetTitle}>
              {slotActionPicker} •{' '}
              {format(selectedDate, 'MMM d', { locale: dateLocale })}
            </Text>
            <Text style={styles.actionSheetSubtitle}>
              {t('calendar.selectAction')}
            </Text>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleCreateAppointment}
              >
                <View
                  style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}
                >
                  <Plus size={24} color="#2563EB" />
                </View>
                <Text style={styles.actionButtonText}>
                  {t('calendar.createAppointment')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleAddTimeOff}
              >
                <View
                  style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}
                >
                  <Clock size={24} color="#D97706" />
                </View>
                <Text style={styles.actionButtonText}>
                  {t('calendar.addTimeOff')}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.actionCancelBtn}
              onPress={() => setSlotActionPicker(null)}
            >
              <Text style={styles.actionCancelText}>{t('common.cancel')}</Text>
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
          <TouchableOpacity activeOpacity={1} style={styles.durationSheet}>
            <View style={styles.durationHandle} />

            <View style={styles.durationHeader}>
              <Text style={styles.durationSheetTitle}>
                {durationPicker?.startTime} → {durationPicker?.endTime}
              </Text>
              <Text style={styles.durationSheetSubtitle}>
                {format(selectedDate, 'EEEE, MMMM d, yyyy', {
                  locale: dateLocale,
                })}
              </Text>
            </View>

            <Text style={styles.durationChipsLabel}>
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
                      isActive && styles.durationChipActive,
                    ]}
                    onPress={() => handleEndTimeSelect(endTime)}
                  >
                    <Text
                      style={[
                        styles.durationChipTime,
                        isActive && styles.durationChipTextActive,
                      ]}
                    >
                      {endTime}
                    </Text>
                    <Text
                      style={[
                        styles.durationChipDuration,
                        isActive && styles.durationChipTextActive,
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
                <Text style={styles.fieldLabel}>
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
                        durationPicker.type === type && styles.typeChipActive,
                      ]}
                      onPress={() =>
                        setDurationPicker((p) => (p ? { ...p, type } : null))
                      }
                    >
                      <Text
                        style={[
                          styles.typeChipText,
                          durationPicker.type === type &&
                            styles.typeChipTextActive,
                        ]}
                      >
                        {t(
                          `calendar.type${type[0].toUpperCase()}${type.slice(1)}`,
                        )}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.fieldLabel}>
                  {t('calendar.timeOffReason')}
                </Text>
                <TextInput
                  style={styles.reasonInput}
                  placeholder={t('calendar.timeOffReason')}
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
                style={styles.durationCancelBtn}
                onPress={handleDurationCancel}
              >
                <Text style={styles.durationCancelText}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.durationConfirmBtn}
                onPress={handleConfirmEndTime}
              >
                <Text style={styles.durationConfirmText}>
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
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  textWhite: { color: '#FFF' },
  stickyHeader: {
    backgroundColor: 'rgba(247, 249, 251, 0.95)',
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
    backgroundColor: 'rgba(5, 17, 37, 0.05)',
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
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.secondary,
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
  dateCardActive: {
    backgroundColor: COLORS.primary,
  },
  dateCardInactive: {
    backgroundColor: COLORS.surfaceContainerLow,
  },
  dateDayName: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.secondary,
    letterSpacing: 0.5,
  },
  dateDayNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
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
    backgroundColor: 'rgba(197, 198, 205, 0.3)',
  },
  timeSlotsColumn: {
    gap: 0,
  },
  timeSlotRow: {
    height: HOUR_HEIGHT,
    flexDirection: 'row',
  },
  timeSlotRowPressed: {
    backgroundColor: 'rgba(5, 17, 37, 0.04)',
  },
  timeSlotLabel: {
    width: TIME_COLUMN_WIDTH,
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.secondary,
    textAlign: 'right',
    paddingRight: 16,
    top: -8,
  },
  slotBorder: {
    flex: 1,
    borderTopWidth: 1,
    borderColor: 'rgba(197, 198, 205, 0.15)',
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
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 8,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(197, 198, 205, 0.2)',
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
    color: COLORS.primary,
  },
  serviceText: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.secondary,
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
    color: COLORS.secondary,
  },
  durationBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5,17,37,0.5)',
    justifyContent: 'flex-end',
  },
  durationSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 16,
    paddingBottom: 48,
  },
  durationHandle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceContainerHighest,
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
    color: COLORS.primary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  durationSheetSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.secondary,
  },
  durationChipsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.secondary,
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
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
  },
  durationChipActive: {
    backgroundColor: COLORS.primary,
  },
  durationChipTime: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 2,
  },
  durationChipDuration: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  durationChipTextActive: {
    color: COLORS.white,
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
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
  },
  durationCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  durationConfirmBtn: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  durationConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  actionSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 16,
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  actionSheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSheetSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary,
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
    backgroundColor: COLORS.surfaceContainerLow,
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
    color: COLORS.primary,
  },
  actionCancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.outline,
  },
  timeOffFields: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
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
    backgroundColor: COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  typeChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  typeChipTextActive: {
    color: COLORS.white,
  },
  reasonInput: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 16,
    padding: 12,
    fontSize: 15,
    color: COLORS.primary,
    minHeight: 60,
    textAlignVertical: 'top',
  },
});
