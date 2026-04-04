import { LinearGradient } from 'expo-linear-gradient';
import { Plus, ArrowLeft } from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/src/components/common/Screen';
import { ScheduleStatsBanner } from '@/src/components/staff/schedule/ScheduleStatsBanner';
import { LeaveList } from '@/src/components/staff/schedule/LeaveList';
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
    <Screen style={styles.container} withPadding={false} transparentStatusBar>
      {/* App Bar */}
      <View style={[styles.appBar, { paddingTop: insets.top }]}>
        <View style={styles.appBarContent}>
          <View style={styles.leftGroup}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.iconBtn}
            >
              <ArrowLeft size={24} color={COLORS.primary} strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={styles.appBarTitle}>
              {t('settings.staff.schedule.title')}
            </Text>
          </View>
        </View>
      </View>

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
            <ScheduleStatsBanner stats={stats} />
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
  appBar: {
    backgroundColor: 'rgba(247, 249, 251, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant + '10',
    zIndex: 100,
  },
  appBarContent: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appBarTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: 'Manrope',
    letterSpacing: -0.5,
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
