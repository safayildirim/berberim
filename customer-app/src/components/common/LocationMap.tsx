import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { COLORS } from '@/src/constants/theme';

interface LocationMapProps {
  latitude: number;
  longitude: number;
  title?: string;
  pinColor?: string;
  style?: any;
}

/**
 * LocationMap Component
 * A localized map display with a central marker, used for displaying shop or event locations.
 */
export const LocationMap: React.FC<LocationMapProps> = ({
  latitude,
  longitude,
  title,
  pinColor = COLORS.primary,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title={title}
          pinColor={pinColor}
        />
      </MapView>
      {/* Subtle overlay to match editorial feel */}
      <View style={styles.overlay} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 160,
    backgroundColor: COLORS.surfaceContainer,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.03)',
    pointerEvents: 'none',
  },
});
