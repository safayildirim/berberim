import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Typography } from '@/src/components/ui';
import { Screen } from '@/src/components/common/Screen';
import { BookingStaffItem } from '@/src/components/booking/BookingStaffItem';
import { useStaff } from '@/src/hooks/queries/useMasterData';
import { useBookingStore } from '@/src/store/useBookingStore';
import { useTenantStore } from '@/src/store/useTenantStore';
import { useTheme } from '@/src/store/useThemeStore';
import { Staff, StaffOption } from '@/src/types';

const optionToStaff = (staff: StaffOption): Staff => ({
  id: staff.staff_user_id,
  first_name: staff.first_name,
  last_name: staff.last_name,
  role: 'staff',
  avatar: staff.avatar_url,
  specialty: staff.specialty,
  bio: staff.bio,
  avg_rating: staff.avg_rating,
  review_count: staff.review_count,
});

export default function BookingStaffScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();
  const { config } = useTenantStore();
  const {
    entryPoint,
    selectedSlot,
    selectedStaffChoice,
    selectedStaffId,
    setStaff,
  } = useBookingStore();
  const isStaffEntry = entryPoint === 'staff_first' && !selectedSlot;
  const {
    data: staffList,
    isLoading,
    error,
  } = useStaff(config?.id, isStaffEntry);

  const availableStaff = useMemo(() => {
    if (isStaffEntry) return staffList || [];
    return (selectedSlot?.available_staff || []).map(optionToStaff);
  }, [isStaffEntry, selectedSlot?.available_staff, staffList]);

  const handleSelectStaff = (staff: Staff | null) => {
    setStaff(staff);
    router.push(isStaffEntry ? '/booking/services' : '/booking/review');
  };

  const screenError =
    !isStaffEntry && !selectedSlot
      ? new Error(t('booking.noSlotSelected'))
      : error;

  return (
    <View style={styles.root}>
      <Screen
        loading={isStaffEntry ? isLoading : false}
        error={screenError}
        style={{ backgroundColor: colors.background }}
        transparentStatusBar
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Typography
            variant="h2"
            style={[styles.title, { color: colors.text }]}
          >
            {isStaffEntry
              ? t('booking.chooseMaster')
              : t('booking.chooseAvailableMaster')}
          </Typography>

          <View style={styles.list}>
            {!isStaffEntry && (
              <BookingStaffItem
                name={t('booking.anyAvailable')}
                isAnyStaff
                isSelected={selectedStaffChoice === 'any'}
                onSelect={() => handleSelectStaff(null)}
              />
            )}

            {availableStaff.map((staff) => (
              <BookingStaffItem
                key={staff.id}
                name={`${staff.first_name} ${staff.last_name}`}
                specialty={staff.specialty || t('staff.masterBarber')}
                rating={staff.avg_rating}
                reviews={staff.review_count}
                avatarUrl={staff.avatar}
                isSelected={selectedStaffId === staff.id}
                onSelect={() => handleSelectStaff(staff)}
              />
            ))}
          </View>
        </ScrollView>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 20,
  },
  list: { gap: 12 },
});
