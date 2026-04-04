import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/common/Screen';
import { ServiceFormActionBar } from '../../src/components/services/form/ServiceFormActionBar';
import { ServiceFormGeneralSection } from '../../src/components/services/form/ServiceFormGeneralSection';
import { ServiceFormHeader } from '../../src/components/services/form/ServiceFormHeader';
import { ServiceFormPricingSection } from '../../src/components/services/form/ServiceFormPricingSection';
import { ServiceFormStatusSection } from '../../src/components/services/form/ServiceFormStatusSection';
import { useServiceForm } from '../../src/hooks/services/useServiceForm';

export default function CreateServiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isEdit = !!id;
  const { t } = useTranslation();

  const { formData, updateField, handleSubmit, isSubmitting, onBack } =
    useServiceForm();

  return (
    <Screen style={styles.container} withPadding={false} transparentStatusBar>
      <ServiceFormHeader isEdit={isEdit} onBack={onBack} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ServiceFormGeneralSection
          name={formData.name}
          category={formData.category}
          description={formData.description}
          onUpdate={updateField}
        />

        <ServiceFormPricingSection
          basePrice={formData.basePrice}
          durationMinutes={formData.durationMinutes}
          pointsReward={formData.pointsReward}
          onUpdate={updateField}
        />

        <ServiceFormStatusSection
          isActive={formData.isActive}
          onUpdate={(val) => updateField('isActive', val)}
        />

        {/* Decorative Visual */}
        <View style={styles.visualContainer}>
          <Image
            source={{
              uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyFBRsrPT6Smjyr1r_J6kqwKb2gMmX8Lqruu7umd2Z2CS3rrHhenyfbjYopkncMLq1kPK6TjWct0IKH2LvPiTelimIz5kjTRQKa8B6BIj-EUT8l28xsDR_cA7Yx3H0yxFIyhKnFViPZDdFQRf5BOuuou93tnxIqv-HFRne-osf0C-Q50hj9dM9gLXRd16C3f1B7QfbO8VKfDJ_B-cRqUE9nzIIT2XzZBPQhNK_HFlyKve4gCXc0AHwuYjx_y7k9iM3lMVE_wn5Cv9v',
            }}
            style={styles.visualImage}
          />
          <View style={styles.visualOverlay}>
            <Text style={styles.visualText}>{t('serviceForm.adminHint')}</Text>
          </View>
        </View>
      </ScrollView>

      <ServiceFormActionBar onSave={handleSubmit} isSubmitting={isSubmitting} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f7f9fb',
  },
  scrollContent: {
    paddingBottom: 140,
  },
  visualContainer: {
    height: 100,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  visualImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  visualOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(27, 38, 59, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  visualText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 3,
    textAlign: 'center',
  },
});
