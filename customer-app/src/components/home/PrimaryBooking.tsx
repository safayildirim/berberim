import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Typography } from '@/src/components/ui';
import { SIZES } from '@/src/constants/theme';
import { useBookingStore } from '@/src/store/useBookingStore';

interface PrimaryBookingProps {
  limitReached: boolean;
}

export const PrimaryBooking = ({ limitReached }: PrimaryBookingProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const startFlow = useBookingStore((state) => state.startFlow);

  const handlePress = () => {
    startFlow();
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
                  : t('home.chooseServicesForAvailability')}
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
    height: 200,
    borderRadius: 32,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#09090b',
  },
  cardDisabled: {
    opacity: 0.8,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.45,
  },
  imageDisabled: {
    opacity: 0.2,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    flexDirection: 'column',
  },
  textSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 30,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  infoText: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 13,
  },
  textDisabled: {
    color: '#94a3b8',
  },
  bookButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonActive: {
    backgroundColor: '#f59e0b',
  },
  buttonDisabled: {
    backgroundColor: '#27272a',
    shadowColor: 'transparent',
  },
  buttonText: {
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
