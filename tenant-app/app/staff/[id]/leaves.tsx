import {
  Plus,
  Trash2,
  Calendar,
  Clock,
  Moon,
  Sun,
  Settings,
  Info,
} from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/src/components/common/Screen';
import { LeaveList } from '@/src/components/staff/leave/LeaveList';
import { SHADOWS, TYPOGRAPHY } from '@/src/constants/theme';
import {
  useAvailabilitySettings,
  useUpdateAvailabilitySettings,
} from '@/src/hooks/queries/useAvailabilitySettings';
import { useStaffMutations } from '@/src/hooks/mutations/useStaffMutations';
import { useScheduleManagement } from '@/src/hooks/staff/useScheduleManagement';
import { useSessionStore } from '@/src/store/useSessionStore';
import { AvailabilitySettings, ScheduleBreak, ScheduleRule } from '@/src/types';
import { useTheme } from '@/src/hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type BreakForm = {
  id?: string;
  day_of_week: ScheduleBreak['day_of_week'];
  start_time: string;
  end_time: string;
  label: string;
};

const defaultForm: BreakForm = {
  day_of_week: 1,
  start_time: '12:00',
  end_time: '13:00',
  label: '',
};

export default function LeavesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isAdmin, user: currentUser } = useSessionStore();
  const [form, setForm] = React.useState<BreakForm | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [settingsDraft, setSettingsDraft] = React.useState({
    buffer_minutes: '0',
    same_day_booking_enabled: true,
    min_advance_minutes: '0',
    max_advance_days: '0',
    max_weekly_bookings: '',
  });
  const {
    createScheduleBreak,
    updateScheduleBreak,
    deleteScheduleBreak,
    updateScheduleRule,
  } = useStaffMutations();
  const { data: settings } = useAvailabilitySettings();
  const updateAvailabilitySettings = useUpdateAvailabilitySettings();

  const { entries, scheduleRules, breaksByDay, isLoading } =
    useScheduleManagement(id!);

  React.useEffect(() => {
    if (!isAdmin() && id !== currentUser?.id) {
      router.replace('/staff');
    }
  }, [isAdmin, id, currentUser?.id, router]);

  React.useEffect(() => {
    if (!settings) return;
    setSettingsDraft({
      buffer_minutes: String(settings.buffer_minutes ?? 0),
      same_day_booking_enabled: settings.same_day_booking_enabled,
      min_advance_minutes: String(settings.min_advance_minutes ?? 0),
      max_advance_days: String(settings.max_advance_days ?? 0),
      max_weekly_bookings:
        settings.max_weekly_customer_bookings === undefined
          ? ''
          : String(settings.max_weekly_customer_bookings),
    });
  }, [settings]);

  const rulesByDay = React.useMemo(
    () =>
      new Map<number, ScheduleRule>(
        scheduleRules.map((rule) => [rule.day_of_week, rule]),
      ),
    [scheduleRules],
  );

  const validateBreak = (next: BreakForm) => {
    const rule = rulesByDay.get(next.day_of_week);
    if (!rule || !rule.is_working_day) {
      return 'Add working hours for this day before creating a break.';
    }
    if (!next.start_time || !next.end_time) {
      return 'Start and end time are required.';
    }
    if (next.start_time >= next.end_time) {
      return 'Break start must be before break end.';
    }
    if (next.start_time < rule.start_time || next.end_time > rule.end_time) {
      return `Break must fit inside working hours (${rule.start_time}-${rule.end_time}).`;
    }
    const overlaps = (breaksByDay[next.day_of_week] || []).find(
      (existing) =>
        existing.id !== next.id &&
        next.start_time < existing.end_time &&
        next.end_time > existing.start_time,
    );
    if (overlaps) {
      return `Break overlaps ${overlaps.start_time}-${overlaps.end_time}.`;
    }
    return null;
  };

  const saveBreak = () => {
    if (!form || !id) return;
    const error = validateBreak(form);
    setFormError(error);
    if (error) return;

    const payload = {
      start_time: form.start_time,
      end_time: form.end_time,
      label: form.label || undefined,
    };

    if (form.id) {
      updateScheduleBreak.mutate(
        { staffId: id, breakId: form.id, data: payload },
        {
          onSuccess: () => setForm(null),
          onError: (err: any) => setFormError(err.message),
        },
      );
      return;
    }

    createScheduleBreak.mutate(
      { staffId: id, data: { ...payload, day_of_week: form.day_of_week } },
      {
        onSuccess: () => setForm(null),
        onError: (err: any) => setFormError(err.message),
      },
    );
  };

  const confirmDelete = (scheduleBreak: ScheduleBreak) => {
    Alert.alert(
      t('settings.staff.schedule.deleteRecurringTitle'),
      `${DAYS[scheduleBreak.day_of_week]} ${scheduleBreak.start_time}-${scheduleBreak.end_time}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () =>
            deleteScheduleBreak.mutate({
              staffId: id!,
              breakId: scheduleBreak.id,
            }),
        },
      ],
    );
  };

  const saveSettings = () => {
    if (!settings) {
      Alert.alert(
        t('settings.staff.schedule.settingsUnavailable'),
        t('settings.staff.schedule.settingsUnavailableSub'),
      );
      return;
    }
    const editableSettings = {
      buffer_minutes: Number(settingsDraft.buffer_minutes),
      same_day_booking_enabled: settingsDraft.same_day_booking_enabled,
      min_advance_minutes: Number(settingsDraft.min_advance_minutes),
      max_advance_days: Number(settingsDraft.max_advance_days),
      max_weekly_customer_bookings: settingsDraft.max_weekly_bookings
        ? Number(settingsDraft.max_weekly_bookings)
        : undefined,
    };
    if (
      Number.isNaN(editableSettings.buffer_minutes) ||
      Number.isNaN(editableSettings.min_advance_minutes) ||
      Number.isNaN(editableSettings.max_advance_days) ||
      editableSettings.buffer_minutes < 0 ||
      editableSettings.min_advance_minutes < 0 ||
      editableSettings.max_advance_days < 1
    ) {
      Alert.alert(
        t('settings.staff.schedule.invalidSettingsTitle'),
        t('settings.staff.schedule.invalidSettingsSub'),
      );
      return;
    }
    const next: AvailabilitySettings = {
      ...settings,
      ...editableSettings,
      max_weekly_customer_bookings:
        editableSettings.max_weekly_customer_bookings ??
        settings.max_weekly_customer_bookings,
    };
    updateAvailabilitySettings.mutate(next, {
      onError: (err: any) =>
        Alert.alert(
          t('settings.staff.schedule.couldNotSaveSettings'),
          err.message,
        ),
    });
  };

  const toggleWorkingDay = (rule: ScheduleRule) => {
    updateScheduleRule.mutate({
      staffId: id!,
      rule: { ...rule, is_working_day: !rule.is_working_day },
    });
  };

  return (
    <Screen
      headerTitle={t('settings.staff.schedule.title')}
      onHeaderBack={() => router.back()}
      showHeaderBack
      style={[styles.container, { backgroundColor: colors.background }]}
      withPadding={false}
      transparentStatusBar
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 140 },
        ]}
      >
        {isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            <SectionHeader
              title={t('settings.staff.schedule.operationalSchedule')}
              subtitle={t('settings.staff.schedule.operationalScheduleSub')}
              icon={Calendar}
            />
            {DAYS.map((day, index) => {
              const rule = rulesByDay.get(index);
              const dayBreaks = breaksByDay[index] || [];
              const isWorking = !!rule?.is_working_day;
              return (
                <View
                  key={day}
                  style={[
                    styles.dayCard,
                    { backgroundColor: colors.surfaceContainerLowest },
                  ]}
                >
                  <View style={styles.dayHeader}>
                    <View style={styles.dayBranding}>
                      <View
                        style={[
                          styles.statusIndicator,
                          {
                            backgroundColor: isWorking
                              ? colors.success + '20'
                              : colors.outline + '10',
                          },
                        ]}
                      >
                        {isWorking ? (
                          <Sun size={16} color={colors.success} />
                        ) : (
                          <Moon size={16} color={colors.secondary} />
                        )}
                      </View>
                      <View>
                        <Text
                          style={[styles.dayTitle, { color: colors.primary }]}
                        >
                          {day}
                        </Text>
                        <Text
                          style={[
                            styles.daySubtitle,
                            { color: colors.secondary },
                          ]}
                        >
                          {isWorking
                            ? `${rule?.start_time} - ${rule?.end_time}`
                            : t('settings.staff.schedule.nonWorkingDay')}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.dayActions}>
                      {rule && (
                        <TouchableOpacity
                          onPress={() => toggleWorkingDay(rule)}
                          style={[
                            styles.actionBtnSmall,
                            { borderColor: colors.border + '30' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.actionBtnSmallText,
                              { color: colors.primary },
                            ]}
                          >
                            {isWorking
                              ? t('settings.staff.schedule.setOff')
                              : t('settings.staff.schedule.setActive')}
                          </Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        disabled={!isWorking}
                        onPress={() =>
                          setForm({
                            ...defaultForm,
                            day_of_week: index as ScheduleBreak['day_of_week'],
                          })
                        }
                        style={[
                          styles.addBreakBtn,
                          {
                            backgroundColor: isWorking
                              ? colors.primary
                              : colors.outline + '20',
                          },
                          !isWorking && styles.disabledButton,
                        ]}
                      >
                        <Plus
                          size={16}
                          color={
                            isWorking ? colors.onPrimary : colors.secondary
                          }
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {isWorking && dayBreaks.length > 0 && (
                    <View style={styles.breaksList}>
                      {dayBreaks.map((scheduleBreak) => (
                        <TouchableOpacity
                          key={scheduleBreak.id}
                          onPress={() =>
                            setForm({
                              id: scheduleBreak.id,
                              day_of_week: scheduleBreak.day_of_week,
                              start_time: scheduleBreak.start_time,
                              end_time: scheduleBreak.end_time,
                              label: scheduleBreak.label || '',
                            })
                          }
                          style={[
                            styles.breakRow,
                            { borderTopColor: colors.border + '15' },
                          ]}
                        >
                          <View style={styles.breakInfo}>
                            <Clock size={14} color={colors.secondary} />
                            <View>
                              <Text
                                style={[
                                  styles.breakTime,
                                  { color: colors.primary },
                                ]}
                              >
                                {scheduleBreak.start_time} -{' '}
                                {scheduleBreak.end_time}
                              </Text>
                              <Text
                                style={[
                                  styles.breakLabel,
                                  { color: colors.secondary },
                                ]}
                              >
                                {scheduleBreak.label ||
                                  t('settings.staff.schedule.standardBreak')}
                              </Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            onPress={() => confirmDelete(scheduleBreak)}
                            style={styles.deleteButton}
                          >
                            <Trash2 size={18} color={colors.error} />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {isWorking && dayBreaks.length === 0 && (
                    <Text
                      style={[styles.emptyText, { color: colors.secondary }]}
                    >
                      {t('settings.staff.schedule.noBreaks')}
                    </Text>
                  )}
                </View>
              );
            })}

            <SectionHeader
              title={t('settings.staff.schedule.timeOffRegistry')}
              subtitle={t('settings.staff.schedule.timeOffRegistrySub')}
              icon={Info}
            />
            <LeaveList entries={entries} />

            <SectionHeader
              title={t('settings.staff.schedule.executionParameters')}
              subtitle={t('settings.staff.schedule.executionParametersSub')}
              icon={Settings}
            />
            <View
              style={[
                styles.settingsCard,
                { backgroundColor: colors.surfaceContainerLowest },
              ]}
            >
              <SettingInput
                label={t('settings.staff.schedule.bufferAfter')}
                value={settingsDraft.buffer_minutes}
                suffix={t('common.minutes')}
                onChangeText={(value) =>
                  setSettingsDraft((current) => ({
                    ...current,
                    buffer_minutes: value,
                  }))
                }
              />
              <TouchableOpacity
                onPress={() =>
                  setSettingsDraft((current) => ({
                    ...current,
                    same_day_booking_enabled: !current.same_day_booking_enabled,
                  }))
                }
                style={[
                  styles.settingRow,
                  { borderTopColor: colors.border + '10' },
                ]}
              >
                <Text
                  style={[styles.settingLabel, { color: colors.secondary }]}
                >
                  {t('settings.staff.schedule.sameDayBooking')}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: settingsDraft.same_day_booking_enabled
                        ? colors.success + '15'
                        : colors.outline + '15',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      {
                        color: settingsDraft.same_day_booking_enabled
                          ? colors.success
                          : colors.secondary,
                      },
                    ]}
                  >
                    {settingsDraft.same_day_booking_enabled
                      ? t('settings.staff.schedule.allowed')
                      : t('settings.staff.schedule.disabled')}
                  </Text>
                </View>
              </TouchableOpacity>
              <SettingInput
                label={t('settings.staff.schedule.minAdvance')}
                value={settingsDraft.min_advance_minutes}
                suffix={t('common.minutes')}
                onChangeText={(value) =>
                  setSettingsDraft((current) => ({
                    ...current,
                    min_advance_minutes: value,
                  }))
                }
              />
              <SettingInput
                label={t('settings.staff.schedule.futureWindow')}
                value={settingsDraft.max_advance_days}
                suffix={t('common.days')}
                onChangeText={(value) =>
                  setSettingsDraft((current) => ({
                    ...current,
                    max_advance_days: value,
                  }))
                }
              />
              <SettingInput
                label={t('settings.staff.schedule.maxWeeklyCap')}
                value={settingsDraft.max_weekly_bookings}
                suffix={t('common.bookings')}
                onChangeText={(value) =>
                  setSettingsDraft((current) => ({
                    ...current,
                    max_weekly_bookings: value,
                  }))
                }
              />
              <TouchableOpacity
                onPress={saveSettings}
                activeOpacity={0.9}
                style={styles.saveSettingsBtn}
                disabled={updateAvailabilitySettings.isPending}
              >
                <LinearGradient
                  colors={[
                    colors.primary,
                    isDark ? '#1b263b' : colors.primary + 'D9',
                  ]}
                  style={styles.saveSettingsBtnGradient}
                >
                  <Text
                    style={[
                      styles.saveSettingsBtnText,
                      { color: colors.onPrimary },
                    ]}
                  >
                    {updateAvailabilitySettings.isPending
                      ? t('settings.staff.schedule.applyingChanges')
                      : t('settings.staff.schedule.updateGlobalLogic')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.fab,
          { bottom: 24 + insets.bottom, backgroundColor: colors.primary },
        ]}
        activeOpacity={0.9}
        onPress={() => setForm(defaultForm)}
      >
        <Plus size={32} color={colors.onPrimary} strokeWidth={2.5} />
      </TouchableOpacity>

      <Modal visible={!!form} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View
            style={[styles.modalCard, { backgroundColor: colors.background }]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.primary }]}>
                  {form?.id
                    ? t('settings.staff.schedule.refineBreak')
                    : t('settings.staff.schedule.addRecurringBreak')}
                </Text>
                <Text
                  style={[styles.modalSubtitle, { color: colors.secondary }]}
                >
                  {t('settings.staff.schedule.modalSubtitle')}
                </Text>
              </View>
            </View>

            {!form?.id && (
              <View style={styles.dayPicker}>
                {DAYS.map((day, index) => {
                  const isSelected = form?.day_of_week === index;
                  const isWorking = !!rulesByDay.get(index)?.is_working_day;
                  return (
                    <TouchableOpacity
                      key={day}
                      disabled={!isWorking}
                      onPress={() =>
                        setForm((current) =>
                          current
                            ? {
                                ...current,
                                day_of_week:
                                  index as ScheduleBreak['day_of_week'],
                              }
                            : current,
                        )
                      }
                      style={[
                        styles.dayPill,
                        {
                          borderColor: isSelected
                            ? colors.primary
                            : colors.border + '30',
                        },
                        isSelected && { backgroundColor: colors.primary },
                        !isWorking && styles.disabledButton,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayPillText,
                          {
                            color: isSelected
                              ? colors.onPrimary
                              : colors.secondary,
                          },
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={styles.modalInputs}>
              <View style={styles.inputRow}>
                <View style={styles.inputStack}>
                  <Text
                    style={[styles.inputLabel, { color: colors.secondary }]}
                  >
                    {t('settings.staff.schedule.startTime')}
                  </Text>
                  <TextInput
                    value={form?.start_time}
                    onChangeText={(value) =>
                      setForm((current) =>
                        current ? { ...current, start_time: value } : current,
                      )
                    }
                    placeholder="e.g. 12:00"
                    placeholderTextColor={colors.outline + '40'}
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.surfaceContainerLow,
                        color: colors.primary,
                      },
                    ]}
                  />
                </View>
                <View style={styles.inputStack}>
                  <Text
                    style={[styles.inputLabel, { color: colors.secondary }]}
                  >
                    {t('settings.staff.schedule.endTime')}
                  </Text>
                  <TextInput
                    value={form?.end_time}
                    onChangeText={(value) =>
                      setForm((current) =>
                        current ? { ...current, end_time: value } : current,
                      )
                    }
                    placeholder="e.g. 13:00"
                    placeholderTextColor={colors.outline + '40'}
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.surfaceContainerLow,
                        color: colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.inputStack}>
                <Text style={[styles.inputLabel, { color: colors.secondary }]}>
                  {t('settings.staff.schedule.labelReason')}
                </Text>
                <TextInput
                  value={form?.label}
                  onChangeText={(value) =>
                    setForm((current) =>
                      current ? { ...current, label: value } : current,
                    )
                  }
                  placeholder="e.g. Lunch or Cleaning"
                  placeholderTextColor={colors.outline + '40'}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surfaceContainerLow,
                      color: colors.primary,
                    },
                  ]}
                />
              </View>
            </View>

            {form?.id && (
              <View
                style={[
                  styles.alertBox,
                  { backgroundColor: colors.info + '10' },
                ]}
              >
                <Info size={16} color={colors.info} />
                <Text style={[styles.alertText, { color: colors.info }]}>
                  {t('settings.staff.schedule.fixedDayAlert')}
                </Text>
              </View>
            )}

            {formError && (
              <View
                style={[
                  styles.alertBox,
                  { backgroundColor: colors.error + '10' },
                ]}
              >
                <Text style={[styles.alertText, { color: colors.error }]}>
                  {formError}
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setForm(null);
                  setFormError(null);
                }}
                style={styles.cancelBtn}
              >
                <Text
                  style={[styles.cancelBtnText, { color: colors.secondary }]}
                >
                  {t('settings.staff.schedule.discard')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveBreak} style={styles.saveBtn}>
                <LinearGradient
                  colors={[
                    colors.primary,
                    isDark ? '#1b263b' : colors.primary + 'E6',
                  ]}
                  style={styles.saveBtnGradient}
                >
                  <Text
                    style={[styles.saveBtnText, { color: colors.onPrimary }]}
                  >
                    {t('settings.staff.schedule.commitBlock')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const SectionHeader = ({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  icon: any;
}) => {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <View
        style={[styles.headerIcon, { backgroundColor: colors.primary + '10' }]}
      >
        <Icon size={20} color={colors.primary} />
      </View>
      <View>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          {title.toUpperCase()}
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.secondary }]}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
};

const SettingInput = ({
  label,
  value,
  suffix,
  onChangeText,
}: {
  label: string;
  value: string;
  suffix: string;
  onChangeText: (value: string) => void;
}) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.settingRow, { borderTopColor: colors.border + '15' }]}>
      <Text style={[styles.settingLabel, { color: colors.secondary }]}>
        {label}
      </Text>
      <View style={styles.settingInputRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="number-pad"
          style={[
            styles.settingInput,
            {
              backgroundColor: colors.surfaceContainerLow,
              color: colors.primary,
              borderColor: colors.border + '15',
            },
          ]}
        />
        <Text style={[styles.settingSuffix, { color: colors.secondary }]}>
          {suffix}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, gap: 24 },
  loader: { padding: 100, alignItems: 'center' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    ...TYPOGRAPHY.label,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  dayCard: {
    borderRadius: 24,
    padding: 20,
    gap: 16,
    ...SHADOWS.sm,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayBranding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  statusIndicator: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 18,
    fontWeight: '900',
  },
  daySubtitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  dayActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtnSmall: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  actionBtnSmallText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  addBreakBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: { opacity: 0.4 },
  breaksList: {
    gap: 12,
  },
  breakRow: {
    borderTopWidth: 1,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  breakTime: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
    fontWeight: '800',
  },
  breakLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
  },
  emptyText: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  settingsCard: {
    borderRadius: 24,
    padding: 24,
    gap: 8,
    ...SHADOWS.sm,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 16,
    borderTopWidth: 1,
  },
  settingLabel: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    fontWeight: '700',
  },
  settingInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingInput: {
    width: 64,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  settingSuffix: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  saveSettingsBtn: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  saveSettingsBtnGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveSettingsBtnText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  fab: {
    position: 'absolute',
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    gap: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 24,
    fontWeight: '900',
  },
  modalSubtitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  dayPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dayPill: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  dayPillText: {
    fontSize: 13,
    fontWeight: '800',
  },
  modalInputs: {
    gap: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 16,
  },
  inputStack: {
    flex: 1,
    gap: 10,
  },
  inputLabel: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginLeft: 4,
  },
  textInput: {
    height: 56,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '700',
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
  },
  alertText: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
  saveBtn: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  saveBtnGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '900',
  },
});
