import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Typography } from '@/src/components/ui';
import { COLORS, SIZES } from '@/src/constants/theme';

export const BrandShowcase = () => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        <View style={styles.item}>
          <Image
            source={{
              uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAwGl8sPMTt5M_er8z9AhZNf94jqk2f6EiEIyuJL_ilFCp1XOnljD_FCw3AG3djIrHiVDfq4N97hlpM5TYGgVs6hofkZCT4O_4yFNQHR2Fh4hJi-RF5yq7dmqZ4SlyYr3jqJckLlcdvcsOwPWZRwT9zWZBtolbMMeKNyco2UVVwULvxiqvauL3pICH2I6YD44gN07fthQ7e7cjfXDNK01lUDESbUMa50YId9vjToSycV_oS3jI_5Lvb4I3DCsTI1laBSTO_zOkaixB6',
            }}
            style={styles.image}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.gradient}
          />
          <Typography variant="caption" style={styles.badge}>
            {t('auth.craftsmanship')}
          </Typography>
        </View>

        <View style={styles.item}>
          <Image
            source={{
              uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8CnUoVcmMAH9ZuEhHKmR4HT9sQTwfG3DlLGZxjPG2EUY3XJKPTnSGOftPSlVpweWbVnzErY4VnQs-ANZDLz2d9mdYiOOp7tMswjLFAXO_RXDIM7zwNemNm7HmAxGKY2R6I5snm4emVSwg-AeeyqrYUK1833SFL2qZ4dXikjjVou6hLm9b6XJR0QzO09opShjYOH2AE3RWYeZPiODo2tuFeNaNIsuiu73MA-Pc1rRRbXsqQjdSAni2CsjNzK6fUYepiW1lMbpCBWcP',
            }}
            style={styles.image}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.gradient}
          />
          <Typography variant="caption" style={styles.badge}>
            {t('auth.experience')}
          </Typography>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: SIZES.xl * 1.5,
    marginBottom: SIZES.md,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  item: {
    flex: 1,
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceContainer,
  },
  image: {
    width: '100%',
    height: '100%',
    tintColor: 'rgba(0,0,0,0.1)', // Subtle grayscale effect attempted
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  badge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
