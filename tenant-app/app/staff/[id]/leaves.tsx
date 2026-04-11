import { Plus, Trash2 } from 'lucide-react-native';
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
import { COLORS, SHADOWS } from '@/src/constants/theme';
import {
  useAvailabilitySettings,
  useUpdateAvailabilitySettings,
} from '@/src/hooks/queries/useAvailabilitySettings';
import { useStaffMutations } from '@/src/hooks/mutations/useStaffMutations';
import { useScheduleManagement } from '@/src/hooks/staff/useScheduleManagement';
import { useSessionStore } from '@/src/store/useSessionStore';
import { AvailabilitySettings, ScheduleBreak, ScheduleRule } from '@/src/types';

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
      'Delete recurring break?',
      `${DAYS[scheduleBreak.day_of_week]} ${scheduleBreak.start_time}-${scheduleBreak.end_time}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
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
      Alert.alert('Settings unavailable', 'Reload settings before saving.');
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
        'Invalid settings',
        'Buffer and minimum advance must be zero or higher. Maximum future window must be at least 1 day.',
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
      onError: (err: any) => Alert.alert('Could not save settings', err.message),
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
      style={styles.container}
      withPadding={false}
      transparentStatusBar
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
      >
        {isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <>
            <SectionTitle title="Working hours and recurring breaks" />
            {DAYS.map((day, index) => {
              const rule = rulesByDay.get(index);
              const dayBreaks = breaksByDay[index] || [];
              const isWorking = !!rule?.is_working_day;
              return (
                <View key={day} style={styles.dayCard}>
                  <View style={styles.dayHeader}>
                    <View>
                      <Text style={styles.dayTitle}>{day}</Text>
                      <Text style={styles.daySubtitle}>
                        {isWorking
                          ? `${rule?.start_time}-${rule?.end_time}`
                          : 'Non-working day'}
                      </Text>
                    </View>
                    <View style={styles.dayActions}>
                      {rule && (
                        <TouchableOpacity
                          onPress={() => toggleWorkingDay(rule)}
                          style={styles.secondarySmallButton}
                        >
                          <Text style={styles.secondarySmallButtonText}>
                            {isWorking ? 'Mark off' : 'Mark working'}
                          </Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        disabled={!isWorking}
                        onPress={() =>
                          setForm({
                            ...defaultForm,
                            day_of_week:
                              index as ScheduleBreak['day_of_week'],
                          })
                        }
                        style={[
                          styles.smallButton,
                          !isWorking && styles.disabledButton,
                        ]}
                      >
                        <Text style={styles.smallButtonText}>Add break</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {dayBreaks.length === 0 ? (
                    <Text style={styles.emptyText}>No recurring breaks.</Text>
                  ) : (
                    dayBreaks.map((scheduleBreak) => (
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
                        style={styles.breakRow}
                      >
                        <View>
                          <Text style={styles.breakTime}>
                            {scheduleBreak.start_time}-{scheduleBreak.end_time}
                          </Text>
                          <Text style={styles.breakLabel}>
                            {scheduleBreak.label || 'Break'}
                            {scheduleBreak.is_inert
                              ? ` · Inert: ${scheduleBreak.inert_reason}`
                              : ''}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => confirmDelete(scheduleBreak)}
                          style={styles.deleteButton}
                        >
                          <Trash2 size={18} color={COLORS.error} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              );
            })}

            <SectionTitle title="Time off" />
            <LeaveList entries={entries} />

            <SectionTitle title="Availability settings" />
            <View style={styles.settingsCard}>
              <SettingInput
                label="Buffer after appointment"
                value={settingsDraft.buffer_minutes}
                suffix="min"
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
                    same_day_booking_enabled:
                      !current.same_day_booking_enabled,
                  }))
                }
                style={styles.settingRow}
              >
                <Text style={styles.settingLabel}>Same-day booking</Text>
                <Text style={styles.settingValue}>
                  {settingsDraft.same_day_booking_enabled ? 'Enabled' : 'Off'}
                </Text>
              </TouchableOpacity>
              <SettingInput
                label="Minimum advance"
                value={settingsDraft.min_advance_minutes}
                suffix="min"
                onChangeText={(value) =>
                  setSettingsDraft((current) => ({
                    ...current,
                    min_advance_minutes: value,
                  }))
                }
              />
              <SettingInput
                label="Maximum future window"
                value={settingsDraft.max_advance_days}
                suffix="days"
                onChangeText={(value) =>
                  setSettingsDraft((current) => ({
                    ...current,
                    max_advance_days: value,
                  }))
                }
              />
              <SettingInput
                label="Max weekly bookings"
                value={settingsDraft.max_weekly_bookings}
                suffix="optional"
                onChangeText={(value) =>
                  setSettingsDraft((current) => ({
                    ...current,
                    max_weekly_bookings: value,
                  }))
                }
              />
              <TouchableOpacity
                onPress={saveSettings}
                style={styles.primaryButton}
                disabled={updateAvailabilitySettings.isPending}
              >
                <Text style={styles.primaryButtonText}>
                  {updateAvailabilitySettings.isPending
                    ? 'Saving...'
                    : 'Save settings'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { bottom: 24 + insets.bottom }]}
        activeOpacity={0.9}
        onPress={() => setForm(defaultForm)}
      >
        <Plus size={32} color={COLORS.white} strokeWidth={2.5} />
      </TouchableOpacity>

      <Modal visible={!!form} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {form?.id ? 'Edit recurring break' : 'Add recurring break'}
            </Text>
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
                        isSelected && styles.dayPillSelected,
                        !isWorking && styles.disabledButton,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayPillText,
                          isSelected && styles.dayPillTextSelected,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            <TextInput
              value={form?.start_time}
              onChangeText={(value) =>
                setForm((current) =>
                  current ? { ...current, start_time: value } : current,
                )
              }
              placeholder="Start time, e.g. 12:00"
              style={styles.input}
            />
            <TextInput
              value={form?.end_time}
              onChangeText={(value) =>
                setForm((current) =>
                  current ? { ...current, end_time: value } : current,
                )
              }
              placeholder="End time, e.g. 13:00"
              style={styles.input}
            />
            <TextInput
              value={form?.label}
              onChangeText={(value) =>
                setForm((current) =>
                  current ? { ...current, label: value } : current,
                )
              }
              placeholder="Label, e.g. Lunch"
              style={styles.input}
            />
            {form?.id && (
              <Text style={styles.helperText}>
                Day cannot be changed. Delete and recreate this break to move it
                to another day.
              </Text>
            )}
            {formError && <Text style={styles.errorText}>{formError}</Text>}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setForm(null);
                  setFormError(null);
                }}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveBreak} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const SectionTitle = ({ title }: { title: string }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

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
}) => (
  <View style={styles.settingRow}>
    <Text style={styles.settingLabel}>{label}</Text>
    <View style={styles.settingInputRow}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        style={styles.settingInput}
      />
      <Text style={styles.settingValue}>{suffix}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.background },
  scrollContent: { padding: 24, gap: 18 },
  loader: { padding: 100, alignItems: 'center' },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 8,
  },
  dayCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  dayActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  dayTitle: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
  daySubtitle: { fontSize: 13, color: COLORS.secondary, marginTop: 2 },
  smallButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  disabledButton: { opacity: 0.35 },
  smallButtonText: { color: COLORS.white, fontWeight: '800' },
  secondarySmallButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondarySmallButtonText: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  emptyText: { color: COLORS.secondary, fontWeight: '600' },
  breakRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.outlineVariant + '40',
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  breakTime: { color: COLORS.primary, fontSize: 16, fontWeight: '900' },
  breakLabel: { color: COLORS.secondary, marginTop: 2 },
  deleteButton: { padding: 8 },
  settingsCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  settingLabel: { color: COLORS.secondary, fontWeight: '700' },
  settingValue: { color: COLORS.primary, fontWeight: '900' },
  settingInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingInput: {
    width: 76,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: COLORS.primary,
    textAlign: 'right',
    backgroundColor: COLORS.background,
  },
  fab: {
    position: 'absolute',
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    gap: 12,
  },
  modalTitle: { fontSize: 22, fontWeight: '900', color: COLORS.primary },
  dayPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayPill: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dayPillSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayPillText: { color: COLORS.primary, fontWeight: '800' },
  dayPillTextSelected: { color: COLORS.white },
  input: {
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 8,
    padding: 14,
    color: COLORS.primary,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  helperText: { color: COLORS.secondary, lineHeight: 18 },
  errorText: { color: COLORS.error, fontWeight: '800' },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  secondaryButton: { paddingHorizontal: 16, paddingVertical: 12 },
  secondaryButtonText: { color: COLORS.secondary, fontWeight: '800' },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryButtonText: { color: COLORS.white, fontWeight: '900' },
});
