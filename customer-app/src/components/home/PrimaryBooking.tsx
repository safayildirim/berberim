import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '@/src/store/useThemeStore';
import { Typography } from '@/src/components/ui';
import { SIZES } from '@/src/constants/theme';
import { useBookingStore } from '@/src/store/useBookingStore';

interface PrimaryBookingProps {
  earliestAvailable: string;
  limitReached: boolean;
}

export const PrimaryBooking = ({
  earliestAvailable,
  limitReached,
}: PrimaryBookingProps) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const resetBooking = useBookingStore((state) => state.reset);

  const handlePress = () => {
    resetBooking();
    router.push('/booking/services');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.card, limitReached && styles.cardDisabled]}
        disabled={limitReached}
        onPress={handlePress}
      >
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
          }}
          style={[styles.bgImage, limitReached && styles.imageDisabled]}
        />
        <LinearGradient
          colors={['transparent', 'rgba(9, 9, 11, 0.95)']}
          style={styles.gradient}
        />

        <View style={styles.content}>
          <View style={styles.textSection}>
            <Typography style={styles.title}>
              {limitReached
                ? t('booking.weeklyLimitReached')
                : t('home.bookNow')}
            </Typography>
            <View style={styles.infoRow}>
              <Clock size={14} color={limitReached ? '#71717a' : '#f59e0b'} />
              <Typography
                variant="caption"
                style={[styles.infoText, limitReached && styles.textDisabled]}
              >
                {limitReached
                  ? t('booking.weeklyLimitReached')
                  : t('home.availableToday', { time: earliestAvailable })}
              </Typography>
            </View>
          </View>

          <View
            style={[
              styles.bookButton,
              limitReached ? styles.buttonDisabled : styles.buttonActive,
            ]}
          >
            <Typography
              style={[
                styles.buttonText,
                { color: limitReached ? '#71717a' : '#000' },
              ]}
            >
              {limitReached ? t('common.error') : t('home.bookNow')}
            </Typography>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SIZES.md,
    marginTop: SIZES.sm,
  },
  card: {
    height: 160,
    borderRadius: 32,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#18181b',
  },
  cardDisabled: {
    opacity: 0.75,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  imageDisabled: {
    opacity: 0.3,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-end',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textSection: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    color: '#e2e8f0',
    fontWeight: '600',
  },
  textDisabled: {
    color: '#71717a',
  },
  bookButton: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: '#f59e0b',
  },
  buttonDisabled: {
    backgroundColor: '#27272a',
  },
  buttonText: {
    fontWeight: '800',
    fontSize: 14,
  },
});
