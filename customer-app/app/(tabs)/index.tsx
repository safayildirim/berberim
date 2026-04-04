import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  CalendarPlus,
  ChevronRight,
  History,
  Star,
  User,
} from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  ImageBackground,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Screen } from '@/src/components/common/Screen';
import { DateTime, Typography } from '@/src/components/ui';
import { COLORS, SHADOWS, SIZES } from '@/src/constants/theme';
import { useCurrentCustomer } from '@/src/hooks/mutations/useAuthMutations';
import { useRebookAppointment } from '@/src/hooks/mutations/useAppointmentMutations';
import {
  useAppointments,
  useBookingLimitStatus,
} from '@/src/hooks/queries/useAppointments';
import { useCampaigns } from '@/src/hooks/queries/useCampaigns';
import { useLoyaltyWallet } from '@/src/hooks/queries/useLoyalty';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: user } = useCurrentCustomer();
  const { data: appointments } = useAppointments('confirmed');
  const { data: pastAppointments } = useAppointments('completed');
  const { data: loyalty } = useLoyaltyWallet();
  const { data: campaigns } = useCampaigns();
  const { mutateAsync: rebook } = useRebookAppointment();
  const { data: bookingLimit } = useBookingLimitStatus();

  const nextAppointment = appointments?.appointments?.[0];
  const lastCompleted = pastAppointments?.appointments?.[0];
  const isBookingLimited = bookingLimit?.can_book === false;

  return (
    <Screen headerTitle={t('home.title')} scrollable transparentStatusBar>
      <View style={styles.container}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Typography variant="caption" style={styles.welcomeLabel}>
            {t('home.welcomeBack', {
              name: user?.profile.first_name || 'Julian',
            })}
          </Typography>
          <Typography variant="h1" style={styles.welcomeTitle}>
            {t('home.lookYourBest')}
          </Typography>

          {isBookingLimited && (
            <View style={styles.limitBanner}>
              <AlertTriangle size={18} color={COLORS.onErrorContainer} />
              <Typography variant="body" style={styles.limitBannerText}>
                {t('home.weeklyLimitBanner', {
                  count: bookingLimit?.bookings_this_week,
                  max: bookingLimit?.max_weekly_bookings,
                })}
              </Typography>
            </View>
          )}

          <TouchableOpacity
            activeOpacity={isBookingLimited ? 1 : 0.9}
            style={[styles.bookCTA, isBookingLimited && styles.bookCTADisabled]}
            onPress={() => {
              if (!isBookingLimited) router.push('/booking/services');
            }}
          >
            <ImageBackground
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1YXnN4EFeo1NxliP_hqjq1sFQzRt6IeW6PlKcF5XTleiPoFT-sYbZ2K99ar0BEKx4xtzKj3yzgfB-KWXQkNsHyIUSUoQaXwYfp8opOGTOkMuXlX-9r0pkXuygtL487FtuQ0SYF9Vr2Au3LOLL7A952F1q6w1_uspApPg9CZVTvd2uAx0UmJ7bgZwh_OwEe6xRNp4prUK35celDAlQ2u6exGExQrn9QV6x1rJcHWyF0LsO-wD_LmPLpm0IDncWDWXx4jMnKS-XE5x7',
              }}
              style={styles.bookCTAImage}
              imageStyle={{ borderRadius: 32 }}
            >
              <View style={styles.bookCTAOverlay}>
                <CalendarPlus
                  color={COLORS.white}
                  size={40}
                  strokeWidth={2}
                  pointerEvents="none"
                />
                <Typography
                  variant="h2"
                  color={COLORS.white}
                  style={styles.bookCTATitle}
                >
                  {t('home.bookNow')}
                </Typography>
                <Typography
                  variant="label"
                  color={COLORS.white}
                  style={styles.bookCTASubtitle}
                >
                  {t('home.availableToday', { time: '09:00' })}
                </Typography>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        </View>

        {/* Upcoming Appointment */}
        {nextAppointment && (
          <View style={styles.section}>
            <Typography variant="h3" style={styles.sectionTitle}>
              {t('home.nextVisit')}
            </Typography>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.appointmentCard}
              onPress={() => router.push(`/appointments/${nextAppointment.id}`)}
            >
              <View style={styles.dateBadge}>
                <DateTime
                  date={nextAppointment.starts_at}
                  formatString="MMM"
                  variant="caption"
                  style={styles.dateMonth}
                  uppercase
                />
                <DateTime
                  date={nextAppointment.starts_at}
                  formatString="dd"
                  variant="h2"
                  style={styles.dateDay}
                />
              </View>
              <View style={styles.appointmentDetails}>
                <DateTime
                  date={nextAppointment.starts_at}
                  formatType="weekday_at_time"
                  variant="h3"
                  style={styles.appointmentTime}
                />
                <View style={styles.appointmentSubDetail}>
                  <User
                    size={16}
                    color={COLORS.onSurfaceVariant}
                    pointerEvents="none"
                  />
                  <Typography
                    variant="caption"
                    style={styles.appointmentDescription}
                  >
                    {nextAppointment.staff?.first_name}{' '}
                    {nextAppointment.staff?.last_name} —{' '}
                    {nextAppointment.services?.[0]?.service_name}
                  </Typography>
                </View>
              </View>
              <View style={styles.appointmentForward}>
                <ChevronRight
                  size={20}
                  color={COLORS.onSurfaceVariant}
                  pointerEvents="none"
                />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Bento Grid */}
        <View style={styles.bentoGrid}>
          {/* Loyalty Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/loyalty')}
            style={[styles.bentoItem, styles.loyaltyCard]}
          >
            <View style={styles.bentoHeader}>
              <Star
                color={COLORS.onTertiaryContainer}
                size={20}
                fill={COLORS.onTertiaryContainer}
                pointerEvents="none"
              />
              <Typography variant="caption" style={styles.bentoLabel}>
                {t('home.loyalty')}
              </Typography>
            </View>
            <View>
              <Typography variant="h1" style={styles.points}>
                {loyalty?.current_points || 0}
              </Typography>
              <Typography variant="caption" style={styles.pointsSub}>
                {t('home.moreToNextReward', {
                  points: loyalty?.lifetime_earned_points || 50,
                })}
              </Typography>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(loyalty?.lifetime_spent_points || 0) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </TouchableOpacity>

          {/* Quick Rebook Card */}
          <TouchableOpacity
            activeOpacity={isBookingLimited ? 1 : 0.8}
            style={[
              styles.bentoItem,
              styles.rebookCard,
              isBookingLimited && styles.bookCTADisabled,
            ]}
            onPress={() => {
              if (isBookingLimited) return;
              if (lastCompleted) {
                rebook(lastCompleted.id).then(() =>
                  router.push('/booking/slots'),
                );
              } else {
                router.push('/booking/services');
              }
            }}
          >
            <View style={styles.bentoHeader}>
              <History color={COLORS.text} size={20} pointerEvents="none" />
              <Typography variant="caption" style={styles.bentoLabelDark}>
                {t('home.quickRebook')}
              </Typography>
            </View>
            <View>
              <Typography variant="label" style={styles.rebookText}>
                {t('home.lastBooking', {
                  service: lastCompleted
                    ? lastCompleted.services
                        .map((s) => s.service_name)
                        .join(' + ')
                    : t('booking.bookAppointment'),
                })}
              </Typography>
              <View style={styles.rebookBtn}>
                <Typography
                  variant="caption"
                  color={COLORS.white}
                  style={styles.rebookBtnText}
                >
                  {t('home.rebookNow')}
                </Typography>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Special Offers */}
        <View style={styles.section}>
          <Typography variant="h3" style={styles.sectionTitle}>
            {t('home.specialOffers')}
          </Typography>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.offersContainer}
          >
            {campaigns?.map((campaign) => (
              <TouchableOpacity
                key={campaign.id}
                activeOpacity={0.9}
                onPress={() =>
                  router.push({
                    pathname: '/campaigns/[id]',
                    params: { id: campaign.id },
                  })
                }
                style={styles.offerCard}
              >
                <ImageBackground
                  source={{ uri: campaign.imageUrl }}
                  style={styles.offerImage}
                  imageStyle={{ borderRadius: 40 }}
                >
                  <View style={styles.offerOverlay}>
                    <View style={styles.promoTag}>
                      <Typography variant="caption" style={styles.promoTagText}>
                        {t('campaigns.limitedOffer')}
                      </Typography>
                    </View>
                    <Typography
                      variant="h2"
                      color={COLORS.white}
                      style={styles.offerTitle}
                    >
                      {campaign.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      color={COLORS.surfaceDim}
                      style={styles.offerDesc}
                    >
                      {campaign.description}
                    </Typography>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SIZES.padding,
    paddingBottom: 20,
  },
  welcomeSection: {
    marginTop: SIZES.md,
    gap: SIZES.xs,
  },
  welcomeLabel: {
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.errorContainer,
    borderRadius: 16,
    padding: 14,
    marginTop: SIZES.md,
  },
  limitBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.onErrorContainer,
  },
  bookCTA: {
    height: 200,
    marginTop: SIZES.lg,
    ...SHADOWS.lg,
  },
  bookCTADisabled: {
    opacity: 0.45,
  },
  bookCTAImage: {
    width: '100%',
    height: '100%',
  },
  bookCTAOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  bookCTATitle: {
    fontWeight: '700',
  },
  bookCTASubtitle: {
    opacity: 0.9,
  },
  section: {
    marginTop: SIZES.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: SIZES.md,
  },
  appointmentCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 32,
    padding: SIZES.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: 'rgba(196, 199, 199, 0.1)',
  },
  dateBadge: {
    backgroundColor: COLORS.secondaryContainer,
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.onSecondaryContainer,
  },
  dateDay: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.onSecondaryContainer,
  },
  appointmentDetails: {
    flex: 1,
    gap: 2,
  },
  appointmentTime: {
    fontSize: 16,
    fontWeight: '700',
  },
  appointmentSubDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  appointmentDescription: {
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  appointmentForward: {
    backgroundColor: COLORS.surfaceContainer,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoGrid: {
    flexDirection: 'row',
    gap: 16,
    marginTop: SIZES.xl,
  },
  bentoItem: {
    flex: 1,
    height: 190,
    borderRadius: 32,
    padding: 20,
    justifyContent: 'space-between',
  },
  loyaltyCard: {
    backgroundColor: COLORS.tertiaryContainer,
  },
  rebookCard: {
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  bentoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bentoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.onTertiaryContainer,
    letterSpacing: -0.2,
  },
  bentoLabelDark: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  points: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.onTertiaryContainer,
  },
  pointsSub: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.onTertiaryContainer,
    opacity: 0.7,
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(134, 131, 130, 0.1)',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.onTertiaryContainer,
    borderRadius: 3,
  },
  rebookText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 12,
  },
  rebookBtn: {
    backgroundColor: COLORS.text,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  rebookBtnText: {
    fontWeight: '900',
    fontSize: 10,
  },
  offersContainer: {
    flexDirection: 'row',
  },
  offerCard: {
    width: width - SIZES.padding * 2,
    height: 220,
    marginRight: 16,
  },
  offerImage: {
    width: '100%',
    height: '100%',
  },
  offerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 40,
    padding: 32,
    justifyContent: 'center',
    gap: 8,
  },
  promoTag: {
    backgroundColor: COLORS.secondaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  promoTagText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.onSecondaryContainer,
  },
  offerTitle: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 28,
  },
  offerDesc: {
    fontSize: 12,
    fontWeight: '500',
  },
});
