import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { COLORS, SIZES } from '@/src/constants/theme';
import { Campaign } from '@/src/types';
import { Card, Typography } from '@/src/components/ui';

interface PromoCardProps {
  campaign: Campaign;
  onPress?: () => void;
}

export const PromoCard: React.FC<PromoCardProps> = ({ campaign, onPress }) => {
  return (
    <Card
      onPress={onPress}
      style={[styles.card, { padding: 0, overflow: 'hidden' }]}
    >
      <Image source={{ uri: campaign.imageUrl }} style={styles.image} />
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Typography variant="h3" color={COLORS.white}>
          {campaign.title}
        </Typography>
        <Typography
          variant="body"
          color={COLORS.white}
          numberOfLines={2}
          style={styles.description}
        >
          {campaign.description}
        </Typography>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    height: 180,
    width: 280,
    marginRight: SIZES.md,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: SIZES.md,
  },
  description: {
    marginTop: 4,
    opacity: 0.9,
  },
});
