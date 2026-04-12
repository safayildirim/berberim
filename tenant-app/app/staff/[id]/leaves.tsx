import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Plus } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/src/components/common/Screen';
import { BreakFormModal } from '@/src/components/staff/availability/BreakFormModal';
import { GlobalControlsPanel } from '@/src/components/staff/availability/GlobalControlsPanel';
import { LeaveRegistrySection } from '@/src/components/staff/availability/LeaveRegistrySection';
import { WeeklyScheduleSection } from '@/src/components/staff/availability/WeeklyScheduleSection';
import { useStaffAvailabilityScreen } from '@/src/hooks/staff/useStaffAvailabilityScreen';
import { useTheme } from '@/src/hooks/useTheme';
import { useTranslation } from 'react-i18next';

export default function LeavesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const availability = useStaffAvailabilityScreen(id);
  const isWide = width >= 980;
  const { t } = useTranslation();

  return (
    <Screen
      headerTitle={t('settings.staff.availability.title')}
      showHeaderBack={true}
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
        keyboardDismissMode="on-drag"
      >
        {availability.isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            <WeeklyScheduleSection
              rulesByDay={availability.rulesByDay}
              breaksByDay={availability.breaksByDay}
              tenantTimezone={availability.tenantTimezone}
              onToggleWorkingDay={availability.toggleWorkingDay}
              onAddBreak={availability.openNewBreakForm}
              onEditBreak={availability.openEditBreakForm}
              onDeleteBreak={availability.confirmDeleteBreak}
            />
            <View style={[styles.bottomGrid, isWide && styles.bottomGridWide]}>
              <View style={isWide && styles.leaveColumn}>
                <LeaveRegistrySection entries={availability.entries} />
              </View>
              <View style={isWide && styles.settingsColumn}>
                <GlobalControlsPanel
                  draft={availability.settingsDraft}
                  isSaving={availability.isSavingSettings}
                  onChange={availability.setSettingsDraft}
                  onSave={availability.saveSettings}
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.fab,
          {
            bottom: insets.bottom + 24,
            backgroundColor: colors.primary,
            shadowColor: colors.black,
          },
        ]}
        activeOpacity={0.88}
        onPress={() => availability.openNewBreakForm()}
      >
        <Plus size={28} color={colors.onPrimary} strokeWidth={2.6} />
      </TouchableOpacity>

      <BreakFormModal
        form={availability.breakForm}
        error={availability.breakFormError}
        rulesByDay={availability.rulesByDay}
        tenantTimezone={availability.tenantTimezone}
        onChange={availability.setBreakForm}
        onClose={availability.closeBreakForm}
        onSave={availability.saveBreak}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    gap: 44,
  },
  loader: {
    padding: 100,
    alignItems: 'center',
  },
  bottomGrid: {
    gap: 28,
  },
  bottomGridWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 36,
  },
  leaveColumn: {
    flex: 2,
  },
  settingsColumn: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
  },
});
