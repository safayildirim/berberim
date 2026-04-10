import { useRouter } from 'expo-router';
import {
  Filter,
  MoreHorizontal,
  Search,
  Star,
  UserPlus,
} from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/src/components/common/Screen';
import { COLORS, SHADOWS } from '@/src/constants/theme';
import { useStaff } from '@/src/hooks/queries/useStaff';
import { useSessionStore } from '@/src/store/useSessionStore';

export default function StaffManagementScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAdmin } = useSessionStore();

  const { data: staffMembers, isLoading, isError } = useStaff();

  const activeCount =
    staffMembers?.filter((s) => s.status === 'active').length || 0;
  const totalCount = staffMembers?.length || 0;

  if (isLoading) {
    return (
      <Screen style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Failed to load staff</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      style={styles.container}
      withPadding={false}
      transparentStatusBar
      headerTitle={t('settings.items.staff')}
      showHeaderBack={true}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 100 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Pro HUD */}
        <View style={styles.hudContainer}>
          <View style={styles.hudGlass}>
            <View style={styles.hudStat}>
              <Text style={styles.hudLabel}>
                {t('settings.staff.totalStaff')}
              </Text>
              <Text style={styles.hudValue}>{totalCount}</Text>
            </View>
            <View style={styles.hudDivider} />
            <View style={styles.hudStat}>
              <Text style={styles.hudLabel}>
                {t('settings.staff.activeNow')}
              </Text>
              <Text style={styles.hudValue}>{activeCount}</Text>
            </View>
            <View style={styles.hudDivider} />
            <View style={styles.hudStat}>
              <Text style={styles.hudLabel}>
                {t('settings.staff.todaysLoad')}
              </Text>
              <Text style={styles.hudValue}>--</Text>
            </View>
          </View>
        </View>

        {/* Search & Filter */}
        <View style={styles.controlsRow}>
          <View style={styles.searchBox}>
            <Search size={20} color={COLORS.secondary} />
            <TextInput
              placeholder="Search staff..."
              placeholderTextColor={COLORS.secondary + '80'}
              style={styles.searchInput}
            />
          </View>
          <View style={styles.filterGroup}>
            <TouchableOpacity style={styles.iconActionBtn}>
              <Filter size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Staff Grid */}
        <View style={styles.staffGrid}>
          {staffMembers?.map((staff) => (
            <TouchableOpacity
              key={staff.id}
              style={styles.staffCard}
              onPress={() => router.push(`/staff/${staff.id}` as any)}
            >
              {staff.status === 'active' && <View style={styles.activeLine} />}
              <View style={styles.cardHeader}>
                <View style={styles.imageWrapper}>
                  {staff.avatar_url ? (
                    <Image
                      source={{ uri: staff.avatar_url }}
                      style={[
                        styles.staffImage,
                        staff.status !== 'active' && styles.inactiveImage,
                      ]}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitial}>
                        {staff.first_name[0]}
                      </Text>
                    </View>
                  )}
                  {staff.status === 'active' && (
                    <View style={styles.onlineDot} />
                  )}
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    staff.status !== 'active' && styles.inactiveBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      staff.status !== 'active' && styles.inactiveStatusText,
                    ]}
                  >
                    {staff.status === 'active' ? 'ACTIVE' : 'OFF-DUTY'}
                  </Text>
                </View>
              </View>

              <View style={styles.cardInfo}>
                <Text style={styles.staffName}>
                  {staff.first_name} {staff.last_name}
                </Text>
                <Text style={styles.staffRole}>
                  {staff.role === 'admin' ? 'Administrator' : 'Staff Member'}
                </Text>

                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>EMAIL</Text>
                    <Text style={styles.statValue} numberOfLines={1}>
                      {staff.email}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>RATING</Text>
                    <View style={styles.ratingValueRow}>
                      <Star
                        size={14}
                        fill={COLORS.warning}
                        color={COLORS.warning}
                        strokeWidth={0}
                      />
                      <Text style={styles.statValue}>
                        {staff.avg_rating?.toFixed(1) || '0.0'} (
                        {staff.review_count || 0})
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.cardActions}>
                {isAdmin() && (
                  <TouchableOpacity
                    style={styles.manageBtn}
                    onPress={() =>
                      router.push(`/staff/${staff.id}/edit` as any)
                    }
                  >
                    <Text style={styles.manageBtnText}>MANAGE</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.reviewsBtn}
                  onPress={() =>
                    router.push(`/staff/${staff.id}/reviews` as any)
                  }
                >
                  <Star size={18} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.moreBtn}>
                  <MoreHorizontal size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* FAB */}
      {isAdmin() && (
        <TouchableOpacity
          style={[styles.fab, { bottom: 24 + insets.bottom }]}
          onPress={() => router.push('/staff/create' as any)}
          activeOpacity={0.9}
        >
          <UserPlus size={28} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingTop: 16,
  },
  hudContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  hudGlass: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.sm,
  },
  hudStat: {
    flex: 1,
    alignItems: 'flex-start',
  },
  hudLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.secondary,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  hudValue: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
  },
  hudDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
    opacity: 0.3,
  },
  controlsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  filterGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  iconActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHigh,
  },
  staffGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  staffCard: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 24,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    ...SHADOWS.sm,
  },
  activeLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: '#10b981',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  imageWrapper: {
    position: 'relative',
  },
  staffImage: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  inactiveImage: {
    opacity: 0.5,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
  },
  onlineDot: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  statusBadge: {
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  inactiveBadge: {
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  inactiveStatusText: {
    color: COLORS.secondary,
  },
  cardInfo: {
    marginBottom: 24,
  },
  staffName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  staffRole: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  statsGrid: {
    flexDirection: 'row',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  manageBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manageBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  reviewsBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    ...SHADOWS.md,
    zIndex: 100,
    elevation: 5,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '600',
  },
});
