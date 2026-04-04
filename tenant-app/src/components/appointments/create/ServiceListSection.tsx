import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, TYPOGRAPHY, SIZES } from '@/src/constants/theme';
import { Service } from '@/src/types';
import { ServiceCard } from './ServiceCard';

interface Props {
  services: Service[];
  isLoading: boolean;
  selectedServices: string[];
  onToggleService: (id: string) => void;
}

export const ServiceListSection = ({
  services,
  isLoading,
  selectedServices,
  onToggleService,
}: Props) => {
  if (isLoading) {
    return <ActivityIndicator color={COLORS.primary} style={styles.loader} />;
  }

  // Optional: Group by category
  const categories = Array.from(new Set(services.map((s) => s.category_name)));

  return (
    <View style={styles.container}>
      {categories.map((category) => (
        <View key={category} style={styles.categoryWrap}>
          <Text style={styles.categoryTitle}>{category}</Text>
          {services
            .filter((s) => s.category_name === category)
            .map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isSelected={selectedServices.includes(service.id)}
                onToggle={onToggleService}
              />
            ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  categoryWrap: {
    marginBottom: SIZES.xl,
  },
  categoryTitle: {
    ...TYPOGRAPHY.label,
    color: COLORS.outline,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: SIZES.md,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  loader: {
    paddingVertical: SIZES.xl,
  },
});
