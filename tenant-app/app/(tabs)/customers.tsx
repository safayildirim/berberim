import { differenceInDays, format, parseISO } from 'date-fns';
import { useRouter } from 'expo-router';
import {
  ChevronDown,
  Clock,
  Search,
  SortAsc,
  UserPlus,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Screen } from '@/src/components/common/Screen';
import { COLORS, SHADOWS } from '@/src/constants/theme';
import { useCustomers } from '@/src/hooks/queries/useCustomers';
import { useSessionStore } from '@/src/store/useSessionStore';
import { Customer } from '@/src/types';

export default function CustomersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { tenant } = useSessionStore();
  const [search, setSearch] = useState('');

  const {
    data: customers,
    isLoading,
    refetch,
  } = useCustomers({
    search: search || undefined,
  });

  const CustomerCard = ({ item }: { item: Customer }) => {
    const fullName = `${item.first_name} ${item.last_name}`;
    const initials = `${item.first_name.charAt(0)}${item.last_name.charAt(0)}`;

    const lastVisitDate = item.last_appointment_at
      ? parseISO(item.last_appointment_at)
      : null;
    const daysSinceLastVisit = lastVisitDate
      ? differenceInDays(new Date(), lastVisitDate)
      : null;

    const isLapsed = daysSinceLastVisit !== null && daysSinceLastVisit > 90;
    const status = isLapsed
      ? 'lapsed'
      : (item.total_completed_appointments || 0) > 10
        ? 'active'
        : 'standard';

    const accentColor =
      status === 'active'
        ? '#10b981'
        : status === 'lapsed'
          ? '#ef4444'
          : COLORS.primary + '33';

    const formattedLastVisit = lastVisitDate
      ? format(lastVisitDate, 'MMM dd, yyyy')
      : '---';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/customers/${item.id}` as any)}
      >
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.avatarContainer}>
              {/* Note: avatar_url removed as per proto spec */}
              <View style={styles.initialsContainer}>
                <Text style={styles.initialsText}>{initials}</Text>
              </View>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{fullName}</Text>
              <View style={styles.detailRow}>
                <Text style={styles.phoneText}>{item.phone_number}</Text>
                <View style={styles.dot} />
                {status === 'lapsed' ? (
                  <Text style={styles.lapsedText}>
                    {t('customers.lapsed', {
                      time: `${Math.floor(daysSinceLastVisit! / 30)}mo`,
                    })}
                  </Text>
                ) : (
                  <Text style={styles.typeText}>
                    {status === 'active'
                      ? t('customers.goldMember')
                      : t('customers.standard')}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.visitsContainer}>
              <Text style={styles.visitsLabel}>{t('customers.visits')}</Text>
              <Text style={styles.visitsCount}>
                {item.total_completed_appointments || 0}
              </Text>
            </View>
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.lastVisitLabel}>
              {t('customers.lastVisit').toUpperCase()}
            </Text>
            <Text style={styles.lastVisitValue}>{formattedLastVisit}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Screen
      style={styles.container}
      withPadding={false}
      transparentStatusBar
      headerTitle={tenant?.name}
      headerSubtitle={t('nav.customers')}
      showNotification
      headerRight={
        <TouchableOpacity
          style={styles.headerAction}
          onPress={() => {}} // TODO: Navigate to add customer
        >
          <UserPlus size={22} color={COLORS.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      }
    >
      <FlatList
        data={customers || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CustomerCard item={item} />}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        ListHeaderComponent={
          <>
            <View style={styles.heroSection}>
              <View style={styles.heroTop}>
                <View>
                  <Text style={styles.heroTitle}>{customers?.length || 0}</Text>
                  <Text style={styles.heroSubtitle}>
                    {t('customers.activeClientsCount')}
                  </Text>
                </View>
              </View>

              <View style={styles.searchRow}>
                <View style={styles.searchBar}>
                  <Search size={20} color={COLORS.secondary} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder={t('customers.searchPlaceholder')}
                    value={search}
                    onChangeText={setSearch}
                    placeholderTextColor={COLORS.secondary + '80'}
                  />
                </View>
              </View>

              <View style={styles.filterRow}>
                <TouchableOpacity style={styles.filterButton}>
                  <SortAsc size={18} color={COLORS.primary} />
                  <Text style={styles.filterButtonText}>
                    {t('customers.sortAZ')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterButtonActive}>
                  <Clock size={16} color={COLORS.white} />
                  <Text style={styles.filterButtonTextActive}>
                    {t('customers.sortRecent')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        }
        ListFooterComponent={
          (customers?.length || 0) > 5 ? (
            <TouchableOpacity style={styles.loadMoreButton}>
              <Text style={styles.loadMoreText}>{t('customers.viewMore')}</Text>
              <ChevronDown size={18} color={COLORS.primary} />
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {isLoading ? t('common.loading') : t('customers.emptyList')}
            </Text>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: COLORS.background, // Match screen
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingTop: 8,
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -2,
  },
  heroSubtitle: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '600',
    marginTop: -4,
    opacity: 0.8,
  },
  searchRow: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.primary,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  filterButtonActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  filterButtonTextActive: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  listContainer: {
    paddingBottom: 120,
  },
  card: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...SHADOWS.sm,
  },
  accentBar: {
    width: 4,
    height: '60%',
    alignSelf: 'center',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  cardContent: {
    flex: 1,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceContainerLow,
    overflow: 'hidden',
    marginRight: 16,
  },
  initialsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 2,
  },
  detailRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  phoneText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
    letterSpacing: 0.5,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  lapsedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ef4444',
  },
  visitsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
  },
  visitsLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.secondary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  visitsCount: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
    lineHeight: 24,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
  },
  lastVisitLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: 1,
  },
  lastVisitValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceContainerHigh,
    marginHorizontal: 60,
    paddingVertical: 14,
    borderRadius: 100,
    marginTop: 24,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.secondary,
    textAlign: 'center',
  },
});
