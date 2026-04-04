import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, TYPOGRAPHY, SIZES } from '@/src/constants/theme';
import { CustomerCard } from './CustomerCard';
import { Customer } from '@/src/types';

interface Props {
  customers: Customer[];
  isLoading: boolean;
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer) => void;
}

export const CustomerListSection = ({
  customers,
  isLoading,
  selectedCustomer,
  onSelectCustomer,
}: Props) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>
          {t('appointmentCreate.recentCustomers')}
        </Text>
        <Text style={styles.count}>
          {t('appointmentCreate.totalCustomers', { count: customers.length })}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <View style={styles.list}>
          {customers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              isSelected={selectedCustomer?.id === customer.id}
              onSelect={onSelectCustomer}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.md,
  },
  title: {
    ...TYPOGRAPHY.label,
    fontWeight: '900',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  count: {
    ...TYPOGRAPHY.caption,
    color: COLORS.outline,
    fontWeight: '700',
  },
  list: {
    paddingBottom: 100, // For footer space
  },
  loader: {
    padding: SIZES.xl,
    alignItems: 'center',
  },
});
