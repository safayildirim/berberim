import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { AlertCircle, UserCircle } from 'lucide-react-native';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';
import { useBookingStore } from '@/src/store/useBookingStore';
import { useCreateAppointment } from '@/src/hooks/mutations/useAppointmentMutations';
import { useTenantStore } from '@/src/store/useTenantStore';
import { BookingStickyFooter } from '@/src/components/booking/BookingStickyFooter';
import { format, parseISO } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { Screen } from '@/src/components/common/Screen';
import { StaffAvatar } from '@/src/components/common/StaffAvatar';

export default function BookingReviewScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { config } = useTenantStore();
  const {
    selectedServices,
    selectedStaff,
    selectedSlot,
    notes,
    totalPrice,
    totalDuration,
    isRebookMode,
  } = useBookingStore();

  const [localNotes, setLocalNotes] = useState(notes);
  const { mutate: createAppointment, isPending } = useCreateAppointment();
  const dateLocale = i18n.language.startsWith('tr') ? tr : enUS;

  const handleConfirm = () => {
    if (!selectedSlot || !config?.id) return;

    createAppointment(
      {
        starts_at: selectedSlot.starts_at,
        service_ids: selectedServices.map((s) => s.id),
        staff_user_id: selectedStaff?.id || '',
        notes_customer: localNotes,
        tenant_id: config.id,
      },
      {
        onSuccess: (data) => {
          router.push({
            pathname: '/booking/success',
            params: { id: data.id },
          });
        },
        onError: (error: any) => {
          Alert.alert(t('booking.bookingFailed'), error.message);
        },
      },
    );
  };

  if (!selectedSlot) return null;

  const startTime = parseISO(selectedSlot.starts_at);

  return (
    <View style={styles.root}>
      <Screen
        style={{ backgroundColor: colors.background }}
        transparentStatusBar
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={100}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Typography
              variant="h2"
              style={[styles.title, { color: colors.text }]}
            >
              {t('booking.reviewTitle')}
            </Typography>

            {/* Main Info Card */}
            <View
              style={[
                styles.mainCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.outlineVariant,
                },
              ]}
            >
              <View style={styles.staffRow}>
                {selectedStaff ? (
                  <StaffAvatar staff={selectedStaff} size={48} />
                ) : (
                  <View
                    style={[
                      styles.anyStaffBadge,
                      {
                        backgroundColor: isDark ? '#18181b' : '#f4f4f5',
                        borderColor: colors.outlineVariant,
                      },
                    ]}
                  >
                    <UserCircle size={24} color="#71717a" />
                  </View>
                )}
                <View>
                  <Typography variant="caption" style={styles.cardLabel}>
                    {t('booking.barber')}
                  </Typography>
                  <Typography
                    variant="h3"
                    style={[styles.cardValue, { color: colors.text }]}
                  >
                    {selectedStaff
                      ? `${selectedStaff.first_name} ${selectedStaff.last_name}`
                      : t('booking.anyAvailable')}
                  </Typography>
                </View>
              </View>

              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.outlineVariant },
                ]}
              />

              <View style={styles.gridRow}>
                <View style={styles.gridItem}>
                  <Typography variant="caption" style={styles.cardLabel}>
                    {t('booking.dateLabel')}
                  </Typography>
                  <Typography
                    variant="h3"
                    style={[styles.cardValue, { color: colors.text }]}
                  >
                    {format(startTime, 'MMM d, yyyy', { locale: dateLocale })}
                  </Typography>
                </View>
                <View
                  style={[
                    styles.verticalDivider,
                    { backgroundColor: colors.outlineVariant },
                  ]}
                />
                <View style={[styles.gridItem, { paddingLeft: 16 }]}>
                  <Typography variant="caption" style={styles.cardLabel}>
                    {t('booking.timeLabel')}
                  </Typography>
                  <Typography
                    variant="h3"
                    style={[styles.cardValue, { color: colors.text }]}
                  >
                    {format(startTime, 'HH:mm')}
                  </Typography>
                </View>
              </View>
            </View>

            {/* Services List */}
            <View style={styles.section}>
              <Typography
                variant="h3"
                style={[styles.sectionTitle, { color: colors.text }]}
              >
                {t('booking.steps.services')}
              </Typography>
              <View
                style={[
                  styles.servicesBox,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255,255,255,0.03)'
                      : '#fafafa',
                    borderColor: colors.outlineVariant,
                  },
                ]}
              >
                {selectedServices.map((srv, i) => (
                  <View key={i} style={styles.serviceRow}>
                    <View>
                      <Typography
                        variant="label"
                        style={[styles.serviceName, { color: colors.text }]}
                      >
                        {srv.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        style={{ color: colors.onSurfaceVariant }}
                      >
                        {srv.duration_minutes} {t('booking.minutes')}
                      </Typography>
                    </View>
                    <Typography
                      variant="label"
                      style={[styles.servicePrice, { color: colors.text }]}
                    >
                      {srv.base_price} TL
                    </Typography>
                  </View>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <Typography
                variant="h3"
                style={[styles.sectionTitle, { color: colors.text }]}
              >
                {t('booking.additionalNotes')}
              </Typography>
              <TextInput
                multiline
                numberOfLines={4}
                value={localNotes}
                onChangeText={setLocalNotes}
                placeholder={t('booking.notePlaceholderInput')}
                placeholderTextColor="#71717a"
                style={[
                  styles.notesInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.outlineVariant,
                    color: colors.text,
                  },
                ]}
              />
            </View>

            {/* Policy */}
            <View style={styles.policyRow}>
              <AlertCircle size={16} color="#71717a" style={{ marginTop: 2 }} />
              <Typography variant="caption" style={styles.policyText}>
                {t('booking.cancellationPolicy')}
              </Typography>
            </View>

            {/* Modify Action */}
            <TouchableOpacity
              onPress={() => router.push('/booking/services')}
              style={styles.modifyButton}
            >
              <Typography variant="label" style={styles.modifyText}>
                {isRebookMode
                  ? t('booking.startNewBooking')
                  : t('booking.modifySelection')}
              </Typography>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Screen>

      <BookingStickyFooter
        label={`${t('booking.total')} (${totalDuration} ${t('booking.minutes')})`}
        value={`${totalPrice} TL`}
        buttonText={
          isPending ? t('common.loading') : t('booking.confirmBookingAction')
        }
        onPress={handleConfirm}
        disabled={isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 160 },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 24 },
  mainCard: {
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    marginBottom: 32,
  },
  staffRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  anyStaffBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#71717a',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 1,
  },
  cardValue: { fontSize: 16, fontWeight: '800' },
  divider: { height: 1, width: '100%', marginVertical: 20 },
  gridRow: { flexDirection: 'row', alignItems: 'center' },
  gridItem: { flex: 1 },
  verticalDivider: { width: 1, height: 40 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  servicesBox: { padding: 20, borderRadius: 24, borderWidth: 1, gap: 16 },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: { fontSize: 15, fontWeight: '700' },
  servicePrice: { fontSize: 15, fontWeight: '800' },
  notesInput: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    height: 120,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  policyRow: { flexDirection: 'row', gap: 12, paddingRight: 20 },
  policyText: { color: '#71717a', lineHeight: 18 },
  modifyButton: { marginTop: 32, alignSelf: 'center' },
  modifyText: {
    color: '#f59e0b',
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});
