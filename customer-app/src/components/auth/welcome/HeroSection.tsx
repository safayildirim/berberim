import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '@/src/components/ui';

const { height } = Dimensions.get('window');

export const HeroSection: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image
        source={{
          uri: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        }}
        style={styles.backgroundImage}
      />

      {/* Overlays */}
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']}
        style={styles.gradient}
      />

      {/* Brand Title */}
      <View style={styles.brandContainer}>
        <Typography variant="h1" style={styles.brandTitle}>
          Berberim
        </Typography>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: height * 0.65,
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  brandContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 100,
  },
  brandTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
});
