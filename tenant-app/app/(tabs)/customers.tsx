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
import { SHADOWS } from '@/src/constants/theme';
import { useCustomers } from '@/src/hooks/queries/useCustomers';
import { useSessionStore } from '@/src/store/useSessionStore';
import { Customer } from '@/src/types';
import { useTheme } from '@/src/hooks/useTheme';

export default function CustomersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
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
        ? colors.success
        : status === 'lapsed'
          ? colors.error
          : colors.primary;

    const formattedLastVisit = lastVisitDate
      ? format(lastVisitDate, 'MMM dd, yyyy')
      : '---';

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border + '20' },
        ]}
        onPress={() => router.push(`/customers/${item.id}` as any)}
      >
        <View
          style={[
            styles.accentBar,
            { backgroundColor: accentColor, opacity: 0.8 },
          ]}
        />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.avatarContainer,
                { backgroundColor: colors.surfaceContainerLow },
              ]}
            >
              <View style={styles.initialsContainer}>
                <Text style={[styles.initialsText, { color: colors.primary }]}>
                  {initials}
                </Text>
              </View>
            </View>
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.primary }]}>
                {fullName}
              </Text>
              <View style={styles.detailRow}>
                <Text style={[styles.phoneText, { color: colors.secondary }]}>
                  {item.phone_number}
                </Text>
                {status === 'lapsed' ? (
                  <Text style={[styles.lapsedText, { color: colors.error }]}>
                    {t('customers.lapsed', {
                      time: `${Math.floor(daysSinceLastVisit! / 30)}mo`,
                    })}
                  </Text>
                ) : (
                  <Text style={[styles.typeText, { color: colors.secondary }]}>
                    {status === 'active'
                      ? t('customers.goldMember')
                      : t('customers.standard')}
                  </Text>
                )}
              </View>
            </View>
            <View
              style={[
                styles.visitsContainer,
                { backgroundColor: colors.surfaceContainerLow },
              ]}
            >
              <Text style={[styles.visitsLabel, { color: colors.secondary }]}>
                {t('customers.visits')}
              </Text>
              <Text style={[styles.visitsCount, { color: colors.primary }]}>
                {item.total_completed_appointments || 0}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.cardFooter,
              { borderTopColor: colors.border + '15' },
            ]}
          >
            <Text style={[styles.lastVisitLabel, { color: colors.secondary }]}>
              {t('customers.lastVisit').toUpperCase()}
            </Text>
            <Text style={[styles.lastVisitValue, { color: colors.primary }]}>
              {formattedLastVisit}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Screen
      style={[styles.container, { backgroundColor: colors.background }]}
      withPadding={false}
      transparentStatusBar
      headerTitle={tenant?.name}
      headerSubtitle={t('nav.customers')}
      showNotification
      headerRight={
        <TouchableOpacity
          style={[
            styles.headerAction,
            { backgroundColor: colors.surfaceContainerLow },
          ]}
          onPress={() => {}} // TODO: Navigate to add customer
        >
          <UserPlus size={22} color={colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      }
    >
      <FlatList
        data={customers || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CustomerCard item={item} />}
        contentContainerStyle={styles.listContainer}
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <>
            <View
              style={[
                styles.heroSection,
                { backgroundColor: colors.background },
              ]}
            >
              <View style={styles.heroTop}>
                <View>
                  <Text style={[styles.heroTitle, { color: colors.primary }]}>
                    {customers?.length || 0}
                  </Text>
                  <Text
                    style={[styles.heroSubtitle, { color: colors.secondary }]}
                  >
                    {t('customers.activeClientsCount')}
                  </Text>
                </View>
              </View>

              <View style={styles.searchRow}>
                <View
                  style={[
                    styles.searchBar,
                    { backgroundColor: colors.surfaceContainerHigh },
                  ]}
                >
                  <Search size={20} color={colors.secondary} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.primary }]}
                    placeholder={t('customers.searchPlaceholder')}
                    value={search}
                    onChangeText={setSearch}
                    placeholderTextColor={colors.secondary + '80'}
                  />
                </View>
              </View>

              <View style={styles.filterRow}>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border + '15',
                    },
                  ]}
                >
                  <SortAsc size={18} color={colors.primary} />
                  <Text
                    style={[styles.filterButtonText, { color: colors.primary }]}
                  >
                    {t('customers.sortAZ')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterButtonActive,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Clock size={16} color={colors.onPrimary} />
                  <Text
                    style={[
                      styles.filterButtonTextActive,
                      { color: colors.onPrimary },
                    ]}
                  >
                    {t('customers.sortRecent')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        }
        ListFooterComponent={
          (customers?.length || 0) > 5 ? (
            <TouchableOpacity
              style={[
                styles.loadMoreButton,
                { backgroundColor: colors.surfaceContainerHigh },
              ]}
            >
              <Text style={[styles.loadMoreText, { color: colors.primary }]}>
                {t('customers.viewMore')}
              </Text>
              <ChevronDown size={18} color={colors.primary} />
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.secondary }]}>
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
    flex: 1,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
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
    letterSpacing: -2,
  },
  heroSubtitle: {
    fontSize: 14,
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
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  filterButtonActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  filterButtonTextActive: {
    fontSize: 14,
    fontWeight: '700',
  },
  listContainer: {
    paddingBottom: 120,
  },
  card: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
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
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  detailRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  phoneText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  lapsedText: {
    fontSize: 12,
    fontWeight: '800',
  },
  visitsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
  },
  visitsLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2,
  },
  visitsCount: {
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 24,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  lastVisitLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  lastVisitValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 60,
    paddingVertical: 14,
    borderRadius: 100,
    marginTop: 24,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '800',
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
});
