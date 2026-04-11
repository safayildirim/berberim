import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { useProfile } from '@/src/hooks/queries/useProfile';
import {
  useAppointments,
  useBookingLimitStatus,
} from '@/src/hooks/queries/useAppointments';
import { useLoyaltyWallet } from '@/src/hooks/queries/useLoyalty';
import { useTenantStore } from '@/src/store/useTenantStore';
import { Staff } from '@/src/types';

export interface UpcomingAppointment {
  shopName: string;
  barberName: string;
  service: string;
  date: string;
  price: string;
  shopImage: string;
}

export interface PastBooking {
  appointmentId: string;
  shopName: string;
  barberName: string;
  staff: Staff | null;
  service: string;
  lastVisit: string;
  shopImage: string;
}

export interface LoyaltyData {
  points: number;
  nextReward: string;
  pointsNeeded: number;
  tier: string;
}

export const useHomeData = () => {
  const { t, i18n } = useTranslation();
  const { user } = useProfile();
  const { data: confirmed } = useAppointments('confirmed');
  const { data: completed } = useAppointments('completed');
  const { data: loyalty } = useLoyaltyWallet();
  const { data: bookingLimit } = useBookingLimitStatus();
  const { config, getBranding } = useTenantStore();

  const branding = getBranding();
  const locale = i18n.language === 'tr' ? tr : enUS;

  const nextAppointment = confirmed?.appointments?.[0];
  const lastCompleted = completed?.appointments?.[0];

  const profile = useMemo(
    () => ({
      name: user?.profile.first_name
        ? `${user.profile.first_name} ${user.profile.last_name || ''}`
        : t('common.guest'),
      avatar:
        user?.profile.avatar_url ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    }),
    [user, t],
  );

  const upcomingAppointment = useMemo((): UpcomingAppointment | null => {
    if (!nextAppointment) return null;
    const d = parseISO(nextAppointment.starts_at);
    return {
      shopName: config?.name || t('common.barberShop'),
      barberName:
        `${nextAppointment.staff?.first_name || ''} ${nextAppointment.staff?.last_name || ''}`.trim(),
      service:
        nextAppointment.services?.[0]?.service_name || t('common.service'),
      date: format(d, 'EEEE, HH:mm', { locale }),
      price: `₺${nextAppointment.total_price || 0}`,
      shopImage:
        branding.logoUrl ||
        'https://images.unsplash.com/photo-1618077360395-f3068be8e001?auto=format&fit=crop&w=150&q=80',
    };
  }, [nextAppointment, t, config, branding, locale]);

  const pastBooking = useMemo((): PastBooking | null => {
    if (!lastCompleted) return null;
    const d = parseISO(lastCompleted.starts_at);
    return {
      appointmentId: lastCompleted.id,
      shopName: config?.name || t('common.barberShop'),
      barberName: lastCompleted.staff?.first_name || '',
      staff: lastCompleted.staff || null,
      service: lastCompleted.services?.[0]?.service_name || '',
      lastVisit: formatDistanceToNow(d, { addSuffix: true, locale }),
      shopImage:
        branding.logoUrl ||
        'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=150&q=80',
    };
  }, [lastCompleted, t, config, branding, locale]);

  const bookingData = useMemo(
    () => ({
      limitReached: bookingLimit?.can_book === false,
    }),
    [bookingLimit],
  );

  const loyaltyData = useMemo(
    (): LoyaltyData => ({
      points: loyalty?.current_points || 0,
      nextReward: t('home.nextReward', { defaultValue: 'Free Haircut' }),
      pointsNeeded: 1500,
      tier:
        (user?.profile.loyalty_points || 0) > 1000
          ? 'Gold Member'
          : 'Standard Member',
    }),
    [loyalty, t, user],
  );

  return {
    profile,
    upcomingAppointment,
    pastBooking,
    bookingData,
    loyaltyData,
    location: config?.address?.split(',')[0] || 'Sakarya, TR',
  };
};
