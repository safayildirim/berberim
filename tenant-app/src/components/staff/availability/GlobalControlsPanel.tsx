import React from 'react';
import { SlidersHorizontal } from 'lucide-react-native';
import {
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { TYPOGRAPHY } from '@/src/constants/theme';
import { useTheme } from '@/src/hooks/useTheme';
import { AvailabilitySettingsDraft } from '@/src/components/staff/availability/types';

type Props = {
  draft: AvailabilitySettingsDraft;
  isSaving: boolean;
  onChange: React.Dispatch<React.SetStateAction<AvailabilitySettingsDraft>>;
  onSave: () => void;
};

export const GlobalControlsPanel = ({
  draft,
  isSaving,
  onChange,
  onSave,
}: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: colors.primaryContainer,
          shadowColor: colors.black,
        },
      ]}
    >
      <SlidersHorizontal
        size={88}
        color={colors.onPrimaryContainer}
        style={styles.watermark}
      />
      <Text style={styles.title}>
        {t('settings.staff.availability.globalControls')}
      </Text>
      <View style={styles.content}>
        <SettingsInput
          label={t('settings.staff.availability.bufferTimeMins')}
          value={draft.buffer_minutes}
          onChangeText={(value) =>
            onChange((current) => ({ ...current, buffer_minutes: value }))
          }
        />
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={styles.switchTitle}>
              {t('settings.staff.availability.sameDayBooking')}
            </Text>
            <Text style={styles.switchSubtitle}>
              {t('settings.staff.availability.allowBookToday')}
            </Text>
          </View>
          <Switch
            value={draft.same_day_booking_enabled}
            onValueChange={() =>
              onChange((current) => ({
                ...current,
                same_day_booking_enabled: !current.same_day_booking_enabled,
              }))
            }
            trackColor={{
              false: 'rgba(255,255,255,0.16)',
              true: colors.white,
            }}
            thumbColor={
              draft.same_day_booking_enabled
                ? colors.primaryContainer
                : colors.surfaceContainerHighest
            }
          />
        </View>
        <SettingsInput
          label={t('settings.staff.availability.minAdvanceMins')}
          value={draft.min_advance_minutes}
          onChangeText={(value) =>
            onChange((current) => ({ ...current, min_advance_minutes: value }))
          }
        />
        <SettingsInput
          label={t('settings.staff.availability.futureWindowDays')}
          value={draft.max_advance_days}
          onChangeText={(value) =>
            onChange((current) => ({ ...current, max_advance_days: value }))
          }
        />
        <SettingsInput
          label={t('settings.staff.availability.maxWeeklyBookings')}
          value={draft.max_weekly_bookings}
          onChangeText={(value) =>
            onChange((current) => ({ ...current, max_weekly_bookings: value }))
          }
        />
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.white }]}
          onPress={onSave}
          disabled={isSaving}
        >
          <Text style={[styles.saveText, { color: colors.primaryContainer }]}>
            {isSaving
              ? t('settings.staff.availability.applyingChanges')
              : t('settings.staff.availability.updateGlobalSettings')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const SettingsInput = ({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        style={styles.input}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    borderRadius: 24,
    padding: 28,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  watermark: {
    position: 'absolute',
    top: 22,
    right: 22,
    opacity: 0.12,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 28,
  },
  content: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(130,141,167,0.78)',
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#ffffff',
    fontWeight: '800',
  },
  switchRow: {
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  switchCopy: {
    flex: 1,
    gap: 4,
  },
  switchTitle: {
    ...TYPOGRAPHY.bodyBold,
    color: '#ffffff',
    fontWeight: '800',
  },
  switchSubtitle: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(130,141,167,0.84)',
    fontSize: 12,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  saveText: {
    ...TYPOGRAPHY.label,
    fontWeight: '900',
  },
});
