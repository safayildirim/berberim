import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/src/components/common/Screen';
import { LeaveStatsBanner } from '@/src/components/staff/leave/ScheduleStatsBanner';
import { LeaveList } from '@/src/components/staff/leave/LeaveList';
import { COLORS, SHADOWS } from '@/src/constants/theme';
import { useScheduleManagement } from '@/src/hooks/staff/useScheduleManagement';
import { useSessionStore } from '@/src/store/useSessionStore';
import { useTranslation } from 'react-i18next';

export default function LeavesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const { isAdmin, user: currentUser } = useSessionStore();

  const { entries, stats, isLoading } = useScheduleManagement(id!);

  React.useEffect(() => {
    if (!isAdmin() && id !== currentUser?.id) {
      router.replace('/staff');
    }
  }, [isAdmin, id, currentUser?.id, router]);

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
            <LeaveStatsBanner stats={stats} />
            <LeaveList entries={entries} />
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: 24 + insets.bottom }]}
        activeOpacity={0.9}
        onPress={() => {}} // TODO: Add leave logic
      >
        <LinearGradient
          colors={[COLORS.primary, '#1b263b']}
          style={styles.fabGradient}
        >
          <Plus size={32} color={COLORS.white} strokeWidth={2.5} />
        </LinearGradient>
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 24,
  },
  loader: {
    padding: 100,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
