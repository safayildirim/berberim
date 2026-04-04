import { useRouter } from 'expo-router';
import { Check, Users } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Screen } from '@/src/components/common/Screen';
import { StaffAvatar } from '@/src/components/common/StaffAvatar';
import { StarRatingDisplay } from '@/src/components/reviews/StarRatingDisplay';
import { Card, Typography } from '@/src/components/ui';
import { COLORS, SIZES } from '@/src/constants/theme';
import { useBookingStore } from '@/src/store/useBookingStore';
import { useTenantStore } from '@/src/store/useTenantStore';
import { Staff } from '@/src/types';

export default function StaffScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { selectedStaff, setStaff, selectedSlot } = useBookingStore();
  const { getBranding } = useTenantStore();
  const { primaryColor } = getBranding();

  // Populate staff list directly from the availability slot (enriched by backend)
  const availableStaff = useMemo(() => {
    if (!selectedSlot) return [];
    return selectedSlot.available_staff.map((s) => ({
      id: s.staff_user_id,
      first_name: s.first_name,
      last_name: s.last_name,
      avatar:
        s.avatar_url || 'https://placehold.co/100x100?text=' + s.first_name[0],
      specialty: s.specialty || t('staff.masterBarber'),
      bio: s.bio,
      role: 'Staff',
      avg_rating: s.avg_rating,
      review_count: s.review_count,
    })) as Staff[];
  }, [selectedSlot, t]);

  const isLoading = false; // Availability loading happened in previous screen
  const error = !selectedSlot ? new Error(t('booking.noSlotSelected')) : null;

  const handleSelectStaff = (staff: any) => {
    setStaff(staff);
    router.push('/booking/review');
  };

  return (
    <Screen
      loading={isLoading}
      error={error}
      empty={availableStaff?.length === 0}
      style={styles.container}
      transparentStatusBar
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Editorial Hero Section */}
        <View style={styles.heroSection}>
          <Typography variant="label" style={styles.stepIndicator}>
            {t('booking.step')} 3 {t('booking.of')} 4
          </Typography>
          <Typography variant="h1" style={styles.heroTitle}>
            {t('booking.chooseMaster')}
          </Typography>
        </View>
        <Card
          onPress={() => handleSelectStaff(null)}
          variant={selectedStaff === null ? 'outlined' : 'elevated'}
          style={[
            styles.staffCard,
            { marginHorizontal: SIZES.padding },
            selectedStaff === null && {
              borderColor: primaryColor,
              backgroundColor: primaryColor + '05',
            },
          ]}
        >
          <View
            style={[styles.avatarContainer, { backgroundColor: COLORS.muted }]}
          >
            <Users size={24} color={COLORS.secondary} />
          </View>
          <View style={styles.staffInfo}>
            <Typography variant="h3">{t('booking.anyAvailable')}</Typography>
            <Typography variant="caption" color={COLORS.secondary}>
              {t('booking.anyAvailableDesc')}
            </Typography>
          </View>
          {selectedStaff === null && (
            <View
              style={[styles.checkboxActive, { backgroundColor: primaryColor }]}
            >
              <Check size={16} color={COLORS.white} />
            </View>
          )}
        </Card>

        <View style={styles.content}>
          {availableStaff?.map((staff) => {
            const isSelected = selectedStaff?.id === staff.id;
            return (
              <View key={staff.id} style={{ paddingHorizontal: SIZES.padding }}>
                <Card
                  onPress={() => handleSelectStaff(staff)}
                  variant={isSelected ? 'outlined' : 'elevated'}
                  style={[
                    styles.staffCard,
                    isSelected && {
                      borderColor: primaryColor,
                      backgroundColor: primaryColor + '05',
                    },
                  ]}
                >
                  <StaffAvatar staff={staff} size={60} style={styles.avatar} />
                  <View style={styles.staffInfo}>
                    <Typography variant="h3">
                      {staff.first_name} {staff.last_name}
                    </Typography>
                    <Typography variant="caption" color={COLORS.secondary}>
                      {staff.specialty}
                    </Typography>
                    <View style={styles.ratingRow}>
                      <StarRatingDisplay
                        rating={staff.avg_rating || 0}
                        reviewCount={staff.review_count || 0}
                        size={14}
                      />
                    </View>
                  </View>
                  {isSelected && (
                    <View
                      style={[
                        styles.checkboxActive,
                        { backgroundColor: primaryColor },
                      ]}
                    >
                      <Check size={16} color={COLORS.white} />
                    </View>
                  )}
                </Card>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    backgroundColor: COLORS.background,
  },
  heroSection: {
    paddingHorizontal: SIZES.padding,
    marginTop: SIZES.md,
    marginBottom: SIZES.md,
  },
  stepIndicator: {
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1.5,
    lineHeight: 36,
    color: COLORS.text,
  },
  scroll: {
    paddingBottom: SIZES.xl,
  },
  content: {
    paddingBottom: SIZES.md,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
    marginBottom: SIZES.md,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  staffInfo: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  checkboxActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SIZES.md,
  },
});
