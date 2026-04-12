import React from 'react';
import { Info, X } from 'lucide-react-native';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { TYPOGRAPHY } from '@/src/constants/theme';
import { useTheme } from '@/src/hooks/useTheme';
import {
  BreakForm,
  WEEK_STARTS_ON_MONDAY,
} from '@/src/components/staff/availability/types';
import { ScheduleRule } from '@/src/types';
import { formatUtcScheduleTimeForZone } from '@/src/lib/time/schedule-time';

type Props = {
  form: BreakForm | null;
  error: string | null;
  rulesByDay: Map<number, ScheduleRule>;
  onChange: React.Dispatch<React.SetStateAction<BreakForm | null>>;
  onClose: () => void;
  onSave: () => void;
  tenantTimezone?: string;
};

export const BreakFormModal = ({
  form,
  error,
  rulesByDay,
  onChange,
  onClose,
  onSave,
  tenantTimezone,
}: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const rule = form ? rulesByDay.get(form.day_of_week) : undefined;

  return (
    <Modal visible={!!form} animationType="fade" transparent>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceContainerLowest,
              shadowColor: colors.black,
            },
          ]}
        >
          <View
            style={[
              styles.header,
              {
                backgroundColor: colors.surfaceContainerLow,
                borderBottomColor: colors.outlineVariant + '1A',
              },
            ]}
          >
            <View style={styles.headerCopy}>
              <Text style={[styles.title, { color: colors.primary }]}>
                {t('settings.staff.availability.manageBreak')}
              </Text>
              <Text style={[styles.subtitle, { color: colors.secondary }]}>
                {form
                  ? `${t(`settings.staff.availability.dayLabels.${form.day_of_week}`)} ${t('settings.staff.availability.operationalSchedule')}`
                  : t('settings.staff.availability.operationalSchedule')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeButton,
                { backgroundColor: colors.surfaceContainerHigh },
              ]}
            >
              <X size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {form && (
            <View style={styles.body}>
              {!form.id && (
                <View style={styles.dayPicker}>
                  {WEEK_STARTS_ON_MONDAY.map((dayOfWeek) => {
                    const isSelected = form.day_of_week === dayOfWeek;
                    const isWorking =
                      !!rulesByDay.get(dayOfWeek)?.is_working_day;
                    return (
                      <TouchableOpacity
                        key={dayOfWeek}
                        disabled={!isWorking}
                        onPress={() =>
                          onChange((current) =>
                            current
                              ? {
                                  ...current,
                                  day_of_week: dayOfWeek,
                                }
                              : current,
                          )
                        }
                        style={[
                          styles.dayPill,
                          {
                            backgroundColor: isSelected
                              ? colors.primary
                              : colors.surfaceContainerLow,
                            borderColor: isSelected
                              ? colors.primary
                              : colors.outlineVariant,
                            opacity: isWorking ? 1 : 0.38,
                          },
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
                          {t(
                            `settings.staff.availability.dayShort.${dayOfWeek}`,
                          )}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <View style={styles.inputRow}>
                <View style={styles.inputRowCell}>
                  <FormInput
                    label={t('settings.staff.availability.startTime')}
                    value={form.start_time}
                    placeholder="13:00"
                    onChangeText={(value) =>
                      onChange((current) =>
                        current ? { ...current, start_time: value } : current,
                      )
                    }
                  />
                </View>
                <View style={styles.inputRowCell}>
                  <FormInput
                    label={t('settings.staff.availability.endTime')}
                    value={form.end_time}
                    placeholder="14:00"
                    onChangeText={(value) =>
                      onChange((current) =>
                        current ? { ...current, end_time: value } : current,
                      )
                    }
                  />
                </View>
              </View>
              <FormInput
                label={t('settings.staff.availability.labelReason')}
                value={form.label}
                placeholder={t('settings.staff.availability.labelReasonPh')}
                onChangeText={(value) =>
                  onChange((current) =>
                    current ? { ...current, label: value } : current,
                  )
                }
              />

              <View
                style={[
                  styles.infoBox,
                  {
                    backgroundColor: colors.tertiaryFixed + '33',
                    borderColor: colors.tertiaryFixed,
                  },
                ]}
              >
                <Info size={18} color={colors.onTertiaryContainer} />
                <Text
                  style={[
                    styles.infoText,
                    { color: colors.onTertiaryContainer },
                  ]}
                >
                  {t('settings.staff.availability.breakFitHint', {
                    hours: rule
                      ? ` (${formatUtcScheduleTimeForZone(
                          rule.start_time,
                          tenantTimezone,
                        )} - ${formatUtcScheduleTimeForZone(
                          rule.end_time,
                          tenantTimezone,
                        )})`
                      : '',
                  })}
                </Text>
              </View>

              {error && (
                <View
                  style={[
                    styles.errorBox,
                    { backgroundColor: colors.error + '18' },
                  ]}
                >
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {error}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View
            style={[
              styles.actions,
              { backgroundColor: colors.surfaceContainerLow },
            ]}
          >
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={onSave}
            >
              <Text style={[styles.saveText, { color: colors.onPrimary }]}>
                {t('settings.staff.availability.saveChanges')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                { borderColor: colors.outlineVariant },
              ]}
              onPress={onClose}
            >
              <Text style={[styles.cancelText, { color: colors.primary }]}>
                {t('settings.staff.availability.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const FormInput = ({
  label,
  value,
  placeholder,
  onChangeText,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.secondary }]}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.outline}
        style={[
          styles.input,
          {
            backgroundColor: colors.surfaceContainerLow,
            borderBottomColor: colors.outlineVariant,
            color: colors.primary,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 560,
    borderRadius: 24,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.24,
    shadowRadius: 32,
    elevation: 10,
  },
  header: {
    paddingHorizontal: 28,
    paddingVertical: 22,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...TYPOGRAPHY.h2,
    fontSize: 20,
    fontWeight: '900',
  },
  subtitle: {
    ...TYPOGRAPHY.label,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 28,
    gap: 20,
  },
  dayPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayPill: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dayPillText: {
    ...TYPOGRAPHY.label,
    fontWeight: '800',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 16,
  },
  inputRowCell: {
    flex: 1,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '900',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  input: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontWeight: '800',
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    ...TYPOGRAPHY.caption,
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  errorBox: {
    borderRadius: 12,
    padding: 14,
  },
  errorText: {
    ...TYPOGRAPHY.label,
    fontWeight: '700',
  },
  actions: {
    paddingHorizontal: 28,
    paddingVertical: 22,
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveText: {
    ...TYPOGRAPHY.label,
    fontWeight: '900',
  },
  cancelButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    ...TYPOGRAPHY.label,
    fontWeight: '800',
  },
});
