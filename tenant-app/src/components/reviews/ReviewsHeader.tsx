import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { MoreVertical } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY } from '@/src/constants/theme';
import { useTranslation } from 'react-i18next';

export const ReviewsHeader: React.FC = () => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrvMy9i0ZG7h-xEsQ3265LRLFP3yS-8TOrhp2lVeJ96-OGiq4miMEEOOBAX6dHsv8Bh8oE6s109GT6wY37nmw2ZV8cBkamkimvEAazbbUwH3O7S-wOdElQ2PlHliFfayrdBdInovDw9jVZUfztH91209Bl_JSkzPa7LfdUyG5PSZrwEtzBNKmZr3LZSUfoS03cQLENx7nOMGTkOXINqi9z69aolC707ZxIome6io-m7MxPUJSvyO2_PCDywnd9a-3APS412e8Sxpxq',
            }}
            style={styles.image}
          />
        </View>
        <Text style={styles.title}>
          {t('reviews.title', 'The Atelier Pro')}
        </Text>
      </View>
      <Pressable
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
      >
        <MoreVertical size={20} color={COLORS.onSurface} strokeWidth={2} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: COLORS.background + 'CC', // Glass effect
    zIndex: 50,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  imageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.outlineVariant + '30',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.onSurface,
    fontWeight: '800',
    fontSize: 24,
  },
  iconButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  pressed: {
    backgroundColor: COLORS.surfaceContainerLow,
    transform: [{ scale: 0.95 }],
  },
});
