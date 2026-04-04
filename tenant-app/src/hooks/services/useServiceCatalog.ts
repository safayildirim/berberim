import { useMemo, useState } from 'react';
import { useServices } from '../queries/useServices';

export function useServiceCatalog() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const { data: services = [], isLoading, isError, refetch } = useServices();

  const filteredServices = useMemo(() => {
    if (activeCategory === 'all') {
      return services;
    }
    // Simple normalization for category filtering
    return services.filter(
      (s) => s.category_name?.toLowerCase() === activeCategory.toLowerCase(),
    );
  }, [services, activeCategory]);

  const stats = useMemo(
    () => ({
      total: services.length,
      active: services.filter((s) => s.is_active).length,
    }),
    [services],
  );

  const categories = useMemo(() => {
    const cats = new Set<string>();
    cats.add('all');
    services.forEach((s) => {
      if (s.category_name) cats.add(s.category_name.toLowerCase());
    });
    return Array.from(cats);
  }, [services]);

  return {
    services: filteredServices,
    stats,
    categories,
    activeCategory,
    setActiveCategory,
    isLoading,
    isError,
    refetch,
  };
}
