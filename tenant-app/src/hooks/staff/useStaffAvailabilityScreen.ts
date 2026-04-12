import React from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  useAvailabilitySettings,
  useUpdateAvailabilitySettings,
} from '@/src/hooks/queries/useAvailabilitySettings';
import { useStaffMutations } from '@/src/hooks/mutations/useStaffMutations';
import { useScheduleManagement } from '@/src/hooks/staff/useScheduleManagement';
import { useSessionStore } from '@/src/store/useSessionStore';
import { AvailabilitySettings, ScheduleBreak, ScheduleRule } from '@/src/types';
import {
  convertZoneScheduleTimeToUtc,
  formatUtcScheduleTimeForZone,
} from '@/src/lib/time/schedule-time';
import {
  AvailabilitySettingsDraft,
  BreakForm,
  DAYS,
  defaultBreakForm,
} from '@/src/components/staff/availability/types';

const defaultSettingsDraft: AvailabilitySettingsDraft = {
  buffer_minutes: '0',
  same_day_booking_enabled: true,
  min_advance_minutes: '0',
  max_advance_days: '0',
  max_weekly_bookings: '',
};

export const useStaffAvailabilityScreen = (staffId?: string) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAdmin, user: currentUser, tenant } = useSessionStore();
  const tenantTimezone = tenant?.timezone;
  const [breakForm, setBreakForm] = React.useState<BreakForm | null>(null);
  const [breakFormError, setBreakFormError] = React.useState<string | null>(
    null,
  );
  const [settingsDraft, setSettingsDraft] =
    React.useState<AvailabilitySettingsDraft>(defaultSettingsDraft);

  const schedule = useScheduleManagement(staffId!);
  const { data: settings } = useAvailabilitySettings();
  const updateAvailabilitySettings = useUpdateAvailabilitySettings();
  const {
    createScheduleBreak,
    updateScheduleBreak,
    deleteScheduleBreak,
    updateScheduleRule,
  } = useStaffMutations();

  React.useEffect(() => {
    if (!staffId) return;
    if (!isAdmin() && staffId !== currentUser?.id) {
      router.replace('/staff');
    }
  }, [isAdmin, staffId, currentUser?.id, router]);

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
        schedule.scheduleRules.map((rule) => [rule.day_of_week, rule]),
      ),
    [schedule.scheduleRules],
  );

  const validateBreak = React.useCallback(
    (next: BreakForm) => {
      const rule = rulesByDay.get(next.day_of_week);
      const nextStartUtc = convertZoneScheduleTimeToUtc(
        next.start_time,
        tenantTimezone,
      );
      const nextEndUtc = convertZoneScheduleTimeToUtc(
        next.end_time,
        tenantTimezone,
      );
      if (!rule || !rule.is_working_day) {
        return 'Add working hours for this day before creating a break.';
      }
      if (!next.start_time || !next.end_time) {
        return 'Start and end time are required.';
      }
      if (nextStartUtc >= nextEndUtc) {
        return 'Break start must be before break end.';
      }
      if (nextStartUtc < rule.start_time || nextEndUtc > rule.end_time) {
        return `Break must fit inside working hours (${formatUtcScheduleTimeForZone(
          rule.start_time,
          tenantTimezone,
        )}-${formatUtcScheduleTimeForZone(rule.end_time, tenantTimezone)}).`;
      }
      const overlaps = (schedule.breaksByDay[next.day_of_week] || []).find(
        (existing) =>
          existing.id !== next.id &&
          nextStartUtc < existing.end_time &&
          nextEndUtc > existing.start_time,
      );
      if (overlaps) {
        return `Break overlaps ${formatUtcScheduleTimeForZone(
          overlaps.start_time,
          tenantTimezone,
        )}-${formatUtcScheduleTimeForZone(overlaps.end_time, tenantTimezone)}.`;
      }
      return null;
    },
    [rulesByDay, schedule.breaksByDay, tenantTimezone],
  );

  const openNewBreakForm = React.useCallback(
    (day?: ScheduleBreak['day_of_week']) => {
      setBreakForm({
        ...defaultBreakForm,
        day_of_week: day ?? defaultBreakForm.day_of_week,
      });
      setBreakFormError(null);
    },
    [],
  );

  const openEditBreakForm = React.useCallback(
    (scheduleBreak: ScheduleBreak) => {
      setBreakForm({
        id: scheduleBreak.id,
        day_of_week: scheduleBreak.day_of_week,
        start_time: formatUtcScheduleTimeForZone(
          scheduleBreak.start_time,
          tenantTimezone,
        ),
        end_time: formatUtcScheduleTimeForZone(
          scheduleBreak.end_time,
          tenantTimezone,
        ),
        label: scheduleBreak.label || '',
      });
      setBreakFormError(null);
    },
    [tenantTimezone],
  );

  const closeBreakForm = React.useCallback(() => {
    setBreakForm(null);
    setBreakFormError(null);
  }, []);

  const saveBreak = React.useCallback(() => {
    if (!breakForm || !staffId) return;
    const error = validateBreak(breakForm);
    setBreakFormError(error);
    if (error) return;

    const payload = {
      start_time: convertZoneScheduleTimeToUtc(
        breakForm.start_time,
        tenantTimezone,
      ),
      end_time: convertZoneScheduleTimeToUtc(
        breakForm.end_time,
        tenantTimezone,
      ),
      label: breakForm.label || undefined,
    };

    if (breakForm.id) {
      updateScheduleBreak.mutate(
        { staffId, breakId: breakForm.id, data: payload },
        {
          onSuccess: closeBreakForm,
          onError: (err: any) => setBreakFormError(err.message),
        },
      );
      return;
    }

    createScheduleBreak.mutate(
      {
        staffId,
        data: { ...payload, day_of_week: breakForm.day_of_week },
      },
      {
        onSuccess: closeBreakForm,
        onError: (err: any) => setBreakFormError(err.message),
      },
    );
  }, [
    breakForm,
    closeBreakForm,
    createScheduleBreak,
    staffId,
    updateScheduleBreak,
    validateBreak,
    tenantTimezone,
  ]);

  const confirmDeleteBreak = React.useCallback(
    (scheduleBreak: ScheduleBreak) => {
      if (!staffId) return;
      Alert.alert(
        t('settings.staff.schedule.deleteRecurringTitle'),
        `${DAYS[scheduleBreak.day_of_week]} ${formatUtcScheduleTimeForZone(
          scheduleBreak.start_time,
          tenantTimezone,
        )}-${formatUtcScheduleTimeForZone(scheduleBreak.end_time, tenantTimezone)}`,
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: () =>
              deleteScheduleBreak.mutate({
                staffId,
                breakId: scheduleBreak.id,
              }),
          },
        ],
      );
    },
    [deleteScheduleBreak, staffId, t, tenantTimezone],
  );

  const saveSettings = React.useCallback(() => {
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
  }, [settings, settingsDraft, t, updateAvailabilitySettings]);

  const toggleWorkingDay = React.useCallback(
    (rule: ScheduleRule) => {
      if (!staffId) return;
      updateScheduleRule.mutate({
        staffId,
        rule: { ...rule, is_working_day: !rule.is_working_day },
      });
    },
    [staffId, updateScheduleRule],
  );

  return {
    ...schedule,
    rulesByDay,
    tenantTimezone,
    breakForm,
    breakFormError,
    settingsDraft,
    isSavingSettings: updateAvailabilitySettings.isPending,
    setBreakForm,
    setSettingsDraft,
    openNewBreakForm,
    openEditBreakForm,
    closeBreakForm,
    saveBreak,
    confirmDeleteBreak,
    saveSettings,
    toggleWorkingDay,
  };
};
