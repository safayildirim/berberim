import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';
import { useBookingStore } from '@/src/store/useBookingStore';
import { BookingStaffItem } from '@/src/components/booking/BookingStaffItem';
import { useRouter } from 'expo-router';
import { Screen } from '@/src/components/common/Screen';
import { Staff } from '@/src/types';

export default function BookingStaffScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const { selectedStaff, setStaff, selectedSlot } = useBookingStore();

  const availableStaff = useMemo(() => {
    if (!selectedSlot) return [];
    return selectedSlot.available_staff.map((s) => ({
      id: s.staff_user_id,
      first_name: s.first_name,
      last_name: s.last_name,
      avatar: s.avatar_url,
      specialty: s.specialty || t('staff.masterBarber'),
      avg_rating: s.avg_rating,
      review_count: s.review_count,
    })) as Staff[];
  }, [t, selectedSlot]);

  const handleSelectStaff = (staff: any) => {
    setStaff(staff);
    router.push('/booking/review');
  };

  const error = !selectedSlot ? new Error(t('booking.noSlotSelected')) : null;

  return (
    <View style={styles.root}>
      <Screen
        loading={false}
        error={error}
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
            {t('booking.chooseMaster')}
          </Typography>

          <View style={styles.list}>
            <BookingStaffItem
              name={t('booking.anyAvailable')}
              isAnyStaff
              isSelected={selectedStaff === null}
              onSelect={() => handleSelectStaff(null)}
            />

            {availableStaff.map((staff) => (
              <BookingStaffItem
                key={staff.id}
                name={`${staff.first_name} ${staff.last_name}`}
                specialty={staff.specialty}
                rating={staff.avg_rating}
                reviews={staff.review_count}
                avatarUrl={staff.avatar}
                isSelected={selectedStaff?.id === staff.id}
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
  root: {
    flex: 1,
  },
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
  list: {
    gap: 12,
  },
});
