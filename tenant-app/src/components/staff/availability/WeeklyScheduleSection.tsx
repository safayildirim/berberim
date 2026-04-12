import React from 'react';
import { Coffee, Edit3, PlusCircle, Trash2, Clock } from 'lucide-react-native';
import {
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { TYPOGRAPHY } from '@/src/constants/theme';
import { useTheme } from '@/src/hooks/useTheme';
import { ScheduleBreak, ScheduleRule } from '@/src/types';
import { formatUtcScheduleTimeForZone } from '@/src/lib/time/schedule-time';
import { WEEK_STARTS_ON_MONDAY } from '@/src/components/staff/availability/types';

type Props = {
  rulesByDay: Map<number, ScheduleRule>;
  breaksByDay: Record<number, ScheduleBreak[]>;
  onToggleWorkingDay: (rule: ScheduleRule) => void;
  onAddBreak: (day: ScheduleBreak['day_of_week']) => void;
  onEditBreak: (scheduleBreak: ScheduleBreak) => void;
  onDeleteBreak: (scheduleBreak: ScheduleBreak) => void;
  tenantTimezone?: string;
};

export const WeeklyScheduleSection = ({
  rulesByDay,
  breaksByDay,
  onToggleWorkingDay,
  onAddBreak,
  onEditBreak,
  onDeleteBreak,
  tenantTimezone,
}: Props) => {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const columns = width >= 1024 ? 4 : width >= 720 ? 2 : 1;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <SectionTitle>
          {t('settings.staff.availability.weeklySchedule')}
        </SectionTitle>
      </View>
      <View style={styles.grid}>
        {WEEK_STARTS_ON_MONDAY.map((dayOfWeek, orderIndex) => (
          <ScheduleDayCard
            key={dayOfWeek}
            day={t(`settings.staff.availability.dayLabels.${dayOfWeek}`)}
            dayNumber={orderIndex + 1}
            rule={rulesByDay.get(dayOfWeek)}
            breaks={breaksByDay[dayOfWeek] || []}
            widthStyle={{ width: getCardWidth(columns, orderIndex) }}
            onToggleWorkingDay={onToggleWorkingDay}
            onAddBreak={() => onAddBreak(dayOfWeek)}
            onEditBreak={onEditBreak}
            onDeleteBreak={onDeleteBreak}
            tenantTimezone={tenantTimezone}
          />
        ))}
      </View>
    </View>
  );
};

const ScheduleDayCard = ({
  day,
  dayNumber,
  rule,
  breaks,
  widthStyle,
  onToggleWorkingDay,
  onAddBreak,
  onEditBreak,
  onDeleteBreak,
  tenantTimezone,
}: {
  day: string;
  dayNumber: number;
  rule?: ScheduleRule;
  breaks: ScheduleBreak[];
  widthStyle: { width: `${number}%` };
  onToggleWorkingDay: (rule: ScheduleRule) => void;
  onAddBreak: () => void;
  onEditBreak: (scheduleBreak: ScheduleBreak) => void;
  onDeleteBreak: (scheduleBreak: ScheduleBreak) => void;
  tenantTimezone?: string;
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const isWorking = !!rule?.is_working_day;

  return (
    <View
      style={[
        styles.card,
        widthStyle,
        {
          backgroundColor: isWorking
            ? colors.surfaceContainerLowest
            : colors.surfaceContainerLow,
          borderColor: colors.outlineVariant + '26',
          opacity: isWorking ? 1 : 0.82,
        },
      ]}
    >
      <View style={styles.cardTop}>
        <View>
          <Text
            style={[
              styles.dayNumber,
              { color: colors.primary + (isWorking ? '66' : '33') },
            ]}
          >
            {String(dayNumber).padStart(2, '0')}
          </Text>
          <Text
            style={[
              styles.dayName,
              { color: isWorking ? colors.primary : colors.secondary },
            ]}
          >
            {day}
          </Text>
        </View>
        {rule && (
          <Switch
            value={isWorking}
            onValueChange={() => onToggleWorkingDay(rule)}
            trackColor={{
              false: colors.surfaceContainerHighest,
              true: colors.primary,
            }}
            thumbColor={colors.white}
          />
        )}
      </View>

      {isWorking && rule ? (
        <>
          <View
            style={[
              styles.hoursPanel,
              { backgroundColor: colors.surfaceContainerLow },
            ]}
          >
            <View style={styles.hoursRow}>
              <View style={styles.inlineLabel}>
                <Clock size={14} color={colors.secondary} />
                <Text style={[styles.metaText, { color: colors.secondary }]}>
                  {t('settings.staff.availability.workingHours')}
                </Text>
              </View>
              <Text style={[styles.hoursText, { color: colors.primary }]}>
                {formatUtcScheduleTimeForZone(rule.start_time, tenantTimezone)}{' '}
                - {formatUtcScheduleTimeForZone(rule.end_time, tenantTimezone)}
              </Text>
            </View>
            <Text style={[styles.breaksLabel, { color: colors.secondary }]}>
              {t('settings.staff.availability.recurringBreaks')}
            </Text>
            {breaks.length > 0 ? (
              <View style={styles.breakList}>
                {breaks.map((scheduleBreak) => (
                  <View
                    key={scheduleBreak.id}
                    style={[
                      styles.breakRow,
                      {
                        backgroundColor: colors.surfaceContainerLowest,
                        borderColor: colors.outlineVariant + '1A',
                      },
                    ]}
                  >
                    <View>
                      <Text
                        style={[styles.breakTime, { color: colors.primary }]}
                      >
                        {formatUtcScheduleTimeForZone(
                          scheduleBreak.start_time,
                          tenantTimezone,
                        )}{' '}
                        -{' '}
                        {formatUtcScheduleTimeForZone(
                          scheduleBreak.end_time,
                          tenantTimezone,
                        )}
                      </Text>
                      <Text
                        style={[styles.breakLabel, { color: colors.secondary }]}
                      >
                        {scheduleBreak.label ||
                          t('settings.staff.availability.standardBreak')}
                      </Text>
                    </View>
                    <View style={styles.breakActions}>
                      <TouchableOpacity
                        onPress={() => onEditBreak(scheduleBreak)}
                        style={styles.iconButton}
                      >
                        <Edit3 size={17} color={colors.secondary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => onDeleteBreak(scheduleBreak)}
                        style={styles.iconButton}
                      >
                        <Trash2 size={17} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View
                style={[
                  styles.emptyBreaks,
                  {
                    backgroundColor: colors.surfaceContainerLow + '80',
                    borderColor: colors.outlineVariant + '4D',
                  },
                ]}
              >
                <Coffee size={20} color={colors.outlineVariant} />
                <Text style={[styles.emptyText, { color: colors.secondary }]}>
                  {t('settings.staff.availability.noBreaksDay')}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.addBreakButton,
              { borderColor: colors.outlineVariant },
            ]}
            onPress={onAddBreak}
          >
            <PlusCircle size={18} color={colors.secondary} />
            <Text style={[styles.addBreakText, { color: colors.secondary }]}>
              {t('settings.staff.availability.addBreak')}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <View
          style={[
            styles.offPanel,
            { backgroundColor: colors.surfaceContainerHigh + '80' },
          ]}
        >
          <Text style={[styles.offText, { color: colors.onTertiaryContainer }]}>
            {t('settings.staff.availability.offDay')}
          </Text>
        </View>
      )}
    </View>
  );
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => {
  const { colors } = useTheme();
  return (
    <Text style={[styles.sectionTitle, { color: colors.primary }]}>
      {children}
    </Text>
  );
};

const getCardWidth = (columns: number, index: number): `${number}%` => {
  if (columns === 1) return '100%';
  if (columns === 2) return index === 1 ? '100%' : '48%';
  return index === 1 ? '48.5%' : '23.5%';
};

const styles = StyleSheet.create({
  section: {
    gap: 24,
  },
  sectionHeader: {
    gap: 16,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  card: {
    minHeight: 236,
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    justifyContent: 'space-between',
    gap: 16,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  dayNumber: {
    ...TYPOGRAPHY.h1,
    fontSize: 30,
    fontWeight: '900',
  },
  dayName: {
    ...TYPOGRAPHY.h3,
    fontSize: 20,
    fontWeight: '900',
  },
  hoursPanel: {
    borderRadius: 12,
    padding: 16,
    gap: 14,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  inlineLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    ...TYPOGRAPHY.label,
    fontSize: 13,
    fontWeight: '600',
  },
  hoursText: {
    ...TYPOGRAPHY.label,
    fontWeight: '800',
  },
  breaksLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '900',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  breakList: {
    gap: 10,
  },
  breakRow: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  breakTime: {
    ...TYPOGRAPHY.label,
    fontWeight: '800',
  },
  breakLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    marginTop: 2,
  },
  breakActions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
  },
  emptyBreaks: {
    minHeight: 112,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  emptyText: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  addBreakButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addBreakText: {
    ...TYPOGRAPHY.label,
    fontWeight: '800',
  },
  offPanel: {
    minHeight: 132,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  offText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '900',
    letterSpacing: 1.4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
