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
import { SHADOWS, TYPOGRAPHY } from '@/src/constants/theme';
import { useStaff } from '@/src/hooks/queries/useStaff';
import { useSessionStore } from '@/src/store/useSessionStore';
import { useTheme } from '@/src/hooks/useTheme';

export default function StaffManagementScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAdmin } = useSessionStore();
  const { colors } = useTheme();

  const { data: staffMembers, isLoading, isError } = useStaff();

  const activeCount =
    staffMembers?.filter((s) => s.status === 'active').length || 0;
  const totalCount = staffMembers?.length || 0;

  if (isLoading) {
    return (
      <Screen style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen style={styles.container}>
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            Failed to load staff
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      style={[styles.container, { backgroundColor: colors.background }]}
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
        keyboardDismissMode="on-drag"
      >
        {/* Pro HUD (Glass Effect) */}
        <View style={styles.hudContainer}>
          <View
            style={[
              styles.hudGlass,
              {
                backgroundColor: colors.surfaceContainerLow,
                borderColor: colors.border + '15',
              },
            ]}
          >
            <View style={styles.hudStat}>
              <Text style={[styles.hudLabel, { color: colors.secondary }]}>
                {t('settings.staff.totalStaff').toUpperCase()}
              </Text>
              <Text style={[styles.hudValue, { color: colors.primary }]}>
                {totalCount}
              </Text>
            </View>
            <View
              style={[
                styles.hudDivider,
                { backgroundColor: colors.border + '15' },
              ]}
            />
            <View style={styles.hudStat}>
              <Text style={[styles.hudLabel, { color: colors.secondary }]}>
                {t('settings.staff.activeNow').toUpperCase()}
              </Text>
              <Text style={[styles.hudValue, { color: colors.primary }]}>
                {activeCount}
              </Text>
            </View>
            <View
              style={[
                styles.hudDivider,
                { backgroundColor: colors.border + '15' },
              ]}
            />
            <View style={styles.hudStat}>
              <Text style={[styles.hudLabel, { color: colors.secondary }]}>
                {t('settings.staff.todaysLoad').toUpperCase()}
              </Text>
              <Text style={[styles.hudValue, { color: colors.primary }]}>
                --
              </Text>
            </View>
          </View>
        </View>

        {/* Search & Filter */}
        <View style={styles.controlsRow}>
          <View
            style={[
              styles.searchBox,
              { backgroundColor: colors.surfaceContainerLow },
            ]}
          >
            <Search size={20} color={colors.secondary} />
            <TextInput
              placeholder="Search staff..."
              placeholderTextColor={colors.secondary + '80'}
              style={[styles.searchInput, { color: colors.primary }]}
            />
          </View>
          <View style={styles.filterGroup}>
            <TouchableOpacity
              style={[
                styles.iconActionBtn,
                {
                  backgroundColor: colors.surfaceContainerLow,
                  borderColor: colors.border + '15',
                },
              ]}
            >
              <Filter size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Staff Grid */}
        <View style={styles.staffGrid}>
          {staffMembers?.map((staff) => {
            const isActive = staff.status === 'active';
            return (
              <TouchableOpacity
                key={staff.id}
                style={[
                  styles.staffCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border + '10',
                  },
                ]}
                onPress={() => router.push(`/staff/${staff.id}` as any)}
              >
                {isActive && (
                  <View
                    style={[
                      styles.activeLine,
                      { backgroundColor: colors.success },
                    ]}
                  />
                )}
                <View style={styles.cardHeader}>
                  <View style={styles.imageWrapper}>
                    {staff.avatar_url ? (
                      <Image
                        source={{ uri: staff.avatar_url }}
                        style={[
                          styles.staffImage,
                          !isActive && styles.inactiveImage,
                        ]}
                      />
                    ) : (
                      <View
                        style={[
                          styles.avatarPlaceholder,
                          { backgroundColor: colors.surfaceContainerHigh },
                        ]}
                      >
                        <Text
                          style={[
                            styles.avatarInitial,
                            { color: colors.primary },
                          ]}
                        >
                          {staff.first_name[0]}
                        </Text>
                      </View>
                    )}
                    {isActive && (
                      <View
                        style={[
                          styles.onlineDot,
                          {
                            backgroundColor: colors.success,
                            borderColor: colors.card,
                          },
                        ]}
                      />
                    )}
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: isActive
                          ? colors.success + '15'
                          : colors.surfaceContainerHigh,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: isActive ? colors.success : colors.secondary },
                      ]}
                    >
                      {isActive ? 'ACTIVE' : 'OFF-DUTY'}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardInfo}>
                  <Text style={[styles.staffName, { color: colors.primary }]}>
                    {staff.first_name} {staff.last_name}
                  </Text>
                  <Text style={[styles.staffRole, { color: colors.secondary }]}>
                    {staff.role === 'admin' ? 'Administrator' : 'Staff Member'}
                  </Text>

                  <View
                    style={[
                      styles.statsGrid,
                      { borderTopColor: colors.border + '10' },
                    ]}
                  >
                    <View style={styles.statItem}>
                      <Text
                        style={[styles.statLabel, { color: colors.secondary }]}
                      >
                        EMAIL
                      </Text>
                      <Text
                        style={[styles.statValue, { color: colors.primary }]}
                        numberOfLines={1}
                      >
                        {staff.email}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text
                        style={[styles.statLabel, { color: colors.secondary }]}
                      >
                        RATING
                      </Text>
                      <View style={styles.ratingValueRow}>
                        <Star
                          size={14}
                          fill={colors.warning}
                          color={colors.warning}
                          strokeWidth={0}
                        />
                        <Text
                          style={[styles.statValue, { color: colors.primary }]}
                        >
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
                      style={[
                        styles.manageBtn,
                        { backgroundColor: colors.surfaceContainerHigh },
                      ]}
                      onPress={() =>
                        router.push(`/staff/${staff.id}/edit` as any)
                      }
                    >
                      <Text
                        style={[
                          styles.manageBtnText,
                          { color: colors.primary },
                        ]}
                      >
                        MANAGE
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.reviewsBtn,
                      { backgroundColor: colors.surfaceContainerHigh },
                    ]}
                    onPress={() =>
                      router.push(`/staff/${staff.id}/reviews` as any)
                    }
                  >
                    <Star size={18} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.moreBtn,
                      { backgroundColor: colors.surfaceContainerHigh },
                    ]}
                  >
                    <MoreHorizontal size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* FAB */}
      {isAdmin() && (
        <TouchableOpacity
          style={[
            styles.fab,
            {
              bottom: 24 + insets.bottom,
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
            },
          ]}
          onPress={() => router.push('/staff/create' as any)}
          activeOpacity={0.9}
        >
          <UserPlus size={28} color={colors.onPrimary} />
        </TouchableOpacity>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.sm,
  },
  hudStat: {
    flex: 1,
    alignItems: 'flex-start',
  },
  hudLabel: {
    ...TYPOGRAPHY.label,
    fontSize: 9,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  hudValue: {
    ...TYPOGRAPHY.h3,
    fontSize: 20,
  },
  hudDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 16,
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
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.bodyBold,
    fontSize: 14,
  },
  filterGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  iconActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  staffGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  staffCard: {
    borderRadius: 32,
    padding: 24,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  activeLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
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
  },
  inactiveImage: {
    opacity: 0.5,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    ...TYPOGRAPHY.h1,
    fontSize: 32,
  },
  onlineDot: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  statusText: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
    letterSpacing: 1,
  },
  cardInfo: {
    marginBottom: 24,
  },
  staffName: {
    ...TYPOGRAPHY.h2,
    fontSize: 22,
    marginBottom: 4,
  },
  staffRole: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    ...TYPOGRAPHY.label,
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 15,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  manageBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manageBtnText: {
    ...TYPOGRAPHY.label,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  reviewsBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
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
    ...TYPOGRAPHY.bodyBold,
    fontSize: 16,
  },
});
