import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useCreateService } from '@/src/hooks/mutations/useServiceMutations';
import { createLogger } from '@/src/lib/logger';

const serviceLogger = createLogger('services');

export interface ServiceFormData {
  name: string;
  category: string;
  description: string;
  basePrice: string;
  durationMinutes: string;
  pointsReward: string;
  isActive: boolean;
}

export function useServiceForm(initialData?: Partial<ServiceFormData>) {
  const router = useRouter();
  const [formData, setFormData] = useState<ServiceFormData>({
    name: initialData?.name || '',
    category: initialData?.category || 'Haircuts',
    description: initialData?.description || '',
    basePrice: initialData?.basePrice || '',
    durationMinutes: initialData?.durationMinutes || '',
    pointsReward: initialData?.pointsReward || '50',
    isActive: initialData?.isActive ?? true,
  });

  const createMutation = useCreateService();

  const updateField = (field: keyof ServiceFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      await createMutation.mutateAsync({
        name: formData.name,
        category_name: formData.category,
        description: formData.description,
        base_price: formData.basePrice,
        duration_minutes: parseInt(formData.durationMinutes, 10) || 0,
        points_reward: parseInt(formData.pointsReward, 10) || 0,
        is_active: formData.isActive,
      });
      router.back();
    } catch (error) {
      serviceLogger.error('Failed to create service', error);
    }
  };

  return {
    formData,
    updateField,
    handleSubmit,
    isSubmitting: createMutation.isPending,
    onBack: () => router.back(),
  };
}
