import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/src/components/common/Screen';
import { TYPOGRAPHY, SIZES } from '@/src/constants/theme';
import { Calendar, Clock } from 'lucide-react-native';
import { Button } from '@/src/components/common/Button';
import { useCustomers } from '@/src/hooks/queries/useCustomers';
import { useServices } from '@/src/hooks/queries/useServices';
import { useStaff } from '@/src/hooks/queries/useStaff';
import { useCreateAppointment } from '@/src/hooks/mutations/useAppointmentMutations';
import { useAppointmentForm } from '@/src/hooks/appointments/useAppointmentForm';
import { AppointmentHeader } from '@/src/components/appointments/create/AppointmentHeader';
import { CustomerSearch } from '@/src/components/appointments/create/CustomerSearch';
import { CustomerListSection } from '@/src/components/appointments/create/CustomerListSection';
import { AppointmentFooter } from '@/src/components/appointments/create/AppointmentFooter';
import { useSessionStore } from '@/src/store/useSessionStore';
import { ProfessionalSearch } from '@/src/components/appointments/create/ProfessionalSearch';
import { ProfessionalCard } from '@/src/components/appointments/create/ProfessionalCard';
import { ProfessionalStatsHUD } from '@/src/components/appointments/create/ProfessionalStatsHUD';
import { ProfessionalSelectionFooter } from '@/src/components/appointments/create/ProfessionalSelectionFooter';
import { ServiceSearch } from '@/src/components/appointments/create/ServiceSearch';
import { ServiceListSection } from '@/src/components/appointments/create/ServiceListSection';
import { ServiceSelectionFooter } from '@/src/components/appointments/create/ServiceSelectionFooter';
import { AppointmentSummaryCard } from '@/src/components/appointments/create/AppointmentSummaryCard';
import { FinalReviewFooter } from '@/src/components/appointments/create/FinalReviewFooter';
import { useTranslation } from 'react-i18next';
import { toLocalRFC3339 } from '@/src/utils/datetime';
import { useTheme } from '@/src/hooks/useTheme';

export default function CreateAppointmentScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user, isAdmin } = useSessionStore();
  const { date: paramDate, time: paramTime } = useLocalSearchParams<{
    date?: string;
    time?: string;
  }>();

  const {
    step,
    displayStep,
    totalSteps,
    customerSearch,
    setCustomerSearch,
    professionalSearch,
    setProfessionalSearch,
    serviceSearch,
    setServiceSearch,
    selectedCustomer,
    setSelectedCustomer,
    selectedServices,
    selectedStaff,
    setSelectedStaff,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    handleNext,
    handleBack,
    toggleService,
  } = useAppointmentForm({
    initialDate: paramDate,
    initialTime: paramTime,
  });

  const { data: customers = [], isLoading: loadingCustomers } = useCustomers({
    search: customerSearch,
  });
  const { data: services = [], isLoading: loadingServices } = useServices({
    is_active: true,
  });
  const { data: staff = [], isLoading: loadingStaff } = useStaff();
  const createAppointment = useCreateAppointment();

  const selectedServiceObjects = React.useMemo(
    () => services.filter((s) => selectedServices.includes(s.id)),
    [services, selectedServices],
  );

  const totalPrice = React.useMemo(
    () =>
      selectedServiceObjects.reduce(
        (sum, s) => sum + parseFloat(s.base_price),
        0,
      ),
    [selectedServiceObjects],
  );

  // Handle local staff filtering
  const filteredStaff = React.useMemo(() => {
    let result = staff;

    // Role-based constraint
    if (!isAdmin()) {
      result = result.filter((s) => s.id === user?.id);
    }

    // Search filter
    if (professionalSearch) {
      const searchLower = professionalSearch.toLowerCase();
      result = result.filter(
        (s) =>
          s.first_name.toLowerCase().includes(searchLower) ||
          s.last_name.toLowerCase().includes(searchLower) ||
          (s.role && s.role.toLowerCase().includes(searchLower)),
      );
    }

    return result;
  }, [staff, professionalSearch, isAdmin, user?.id]);

  // Handle local service filtering
  const filteredServices = React.useMemo(() => {
    if (!serviceSearch) return services;
    const searchLower = serviceSearch.toLowerCase();
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(searchLower) ||
        s.category_name.toLowerCase().includes(searchLower),
    );
  }, [services, serviceSearch]);

  // Handle staff constraint: auto-select if not admin
  useEffect(() => {
    if (!isAdmin() && user?.id && !selectedStaff) {
      setSelectedStaff(user.id);
    }
  }, [isAdmin, user?.id, selectedStaff, setSelectedStaff]);

  const handleConfirm = () => {
    if (!selectedCustomer || !selectedStaff) return;
    createAppointment.mutate(
      {
        customer_id: selectedCustomer.id,
        service_ids: selectedServices,
        staff_user_id: selectedStaff,
        starts_at: toLocalRFC3339(selectedDate, selectedTime),
      },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Appointment created successfully!');
          router.replace('/(tabs)/calendar');
        },
        onError: (err: any) => {
          Alert.alert('Error', err?.message || 'Failed to create appointment.');
        },
      },
    );
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <CustomerSearch
        search={customerSearch}
        onSearchChange={setCustomerSearch}
        onQuickAdd={() => {
          // Handle adding quick customer
        }}
      />
      <CustomerListSection
        customers={customers}
        isLoading={loadingCustomers}
        selectedCustomer={selectedCustomer}
        onSelectCustomer={setSelectedCustomer}
      />
    </View>
  );

  const renderStep2 = () => {
    const selectedStaffMember =
      staff.find((s) => s.id === selectedStaff) || null;

    return (
      <View style={styles.stepContainer}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.stepHeading, { color: colors.primary }]}>
            {t('appointmentCreate.assignProfessional')}
          </Text>
          <Text style={[styles.stepSubheading, { color: colors.secondary }]}>
            {t('appointmentCreate.assignProfessionalSub')}
          </Text>
        </View>

        {isAdmin() && (
          <ProfessionalSearch
            search={professionalSearch}
            onSearchChange={setProfessionalSearch}
          />
        )}

        <View style={styles.professionalList}>
          {loadingStaff ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            filteredStaff.map((s) => (
              <ProfessionalCard
                key={s.id}
                staff={s}
                isSelected={selectedStaff === s.id}
                onSelect={(st) => setSelectedStaff(st.id)}
              />
            ))
          )}
        </View>

        {isAdmin() && (
          <ProfessionalStatsHUD
            selectedStaff={selectedStaffMember}
            allStaff={staff}
          />
        )}
      </View>
    );
  };

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.stepHeading, { color: colors.primary }]}>
          {t('appointmentCreate.chooseServices')}
        </Text>
        <Text style={[styles.stepSubheading, { color: colors.secondary }]}>
          {t('appointmentCreate.chooseServicesSub')}
        </Text>
      </View>

      <ServiceSearch search={serviceSearch} onSearchChange={setServiceSearch} />

      <ServiceListSection
        services={filteredServices}
        isLoading={loadingServices}
        selectedServices={selectedServices}
        onToggleService={toggleService}
      />
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.primary }]}>
        Pick Date & Time
      </Text>

      <View style={styles.fieldGroup}>
        <View style={styles.fieldLabelRow}>
          <Calendar size={18} color={colors.secondary} />
          <Text style={[styles.fieldLabel, { color: colors.secondary }]}>
            Date
          </Text>
        </View>
        <TextInput
          style={[
            styles.fieldInput,
            {
              backgroundColor: colors.surfaceContainerLow,
              color: colors.primary,
              borderColor: colors.border + '40',
            },
          ]}
          value={selectedDate}
          onChangeText={setSelectedDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.secondary + '80'}
        />
      </View>

      <View style={styles.fieldGroup}>
        <View style={styles.fieldLabelRow}>
          <Clock size={18} color={colors.secondary} />
          <Text style={[styles.fieldLabel, { color: colors.secondary }]}>
            Time
          </Text>
        </View>
        <TextInput
          style={[
            styles.fieldInput,
            {
              backgroundColor: colors.surfaceContainerLow,
              color: colors.primary,
              borderColor: colors.border + '40',
            },
          ]}
          value={selectedTime}
          onChangeText={setSelectedTime}
          placeholder="HH:MM"
          placeholderTextColor={colors.secondary + '80'}
        />
      </View>

      <Button
        title="Review"
        disabled={!selectedDate || !selectedTime}
        onPress={handleNext}
        size="lg"
        fullWidth
        style={styles.bottomBtn}
      />
    </View>
  );

  const renderStep5 = () => {
    const selectedStaffMember =
      staff.find((s) => s.id === selectedStaff) || null;

    return (
      <View style={styles.stepContainer}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.stepHeading, { color: colors.primary }]}>
            {t('appointmentCreate.reviewAppointment')}
          </Text>
          <Text style={[styles.stepSubheading, { color: colors.secondary }]}>
            {t('appointmentCreate.reviewAppointmentSub')}
          </Text>
        </View>

        <AppointmentSummaryCard
          customer={selectedCustomer}
          staff={selectedStaffMember}
          services={selectedServiceObjects}
          date={selectedDate}
          time={selectedTime}
        />
      </View>
    );
  };

  return (
    <Screen
      style={[styles.container, { backgroundColor: colors.background }]}
      withPadding={false}
    >
      <AppointmentHeader
        onClose={() => handleBack(router.back)}
        onBack={() => handleBack(router.back)}
        currentStep={displayStep}
        totalSteps={totalSteps}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </ScrollView>

      {step === 1 && (
        <AppointmentFooter onNext={handleNext} disabled={!selectedCustomer} />
      )}

      {step === 2 && (
        <ProfessionalSelectionFooter
          selectedStaff={staff.find((s) => s.id === selectedStaff) || null}
          onContinue={handleNext}
        />
      )}

      {step === 3 && (
        <ServiceSelectionFooter
          selectedCount={selectedServices.length}
          totalPrice={totalPrice}
          onContinue={handleNext}
          hasDateTime={!!paramDate && !!paramTime}
        />
      )}
      {step === 5 && (
        <FinalReviewFooter
          totalPrice={totalPrice}
          loading={createAppointment.isPending}
          onConfirm={handleConfirm}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SIZES.lg,
    paddingTop: SIZES.lg,
  },
  stepContainer: {
    flex: 1,
  },
  sectionHeader: {
    marginBottom: SIZES.xl,
  },
  stepHeading: {
    ...TYPOGRAPHY.h1,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  stepSubheading: {
    ...TYPOGRAPHY.body,
  },
  stepTitle: {
    ...TYPOGRAPHY.h2,
    marginBottom: SIZES.lg,
  },
  loader: {
    marginTop: SIZES.xl,
  },
  professionalList: {
    marginTop: SIZES.sm,
  },
  fieldGroup: {
    marginBottom: SIZES.lg,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
    gap: 8,
  },
  fieldLabel: {
    ...TYPOGRAPHY.label,
    fontWeight: '700',
  },
  fieldInput: {
    borderRadius: SIZES.radius,
    borderWidth: 1,
    paddingHorizontal: SIZES.md,
    height: 54,
    ...TYPOGRAPHY.body,
  },
  bottomBtn: {
    marginTop: SIZES.xl,
  },
});
