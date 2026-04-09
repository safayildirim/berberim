import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { SIZES } from '@/src/constants/theme';

export const OTPBrandAnchor = () => {
  return (
    <View style={styles.container}>
      <Image
        source={{
          uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBB-HE5-U0E3djeCM_Ukqw_f2CjHIv0p3Ck7ap7K85mNsC87XeEttXV9WjoqsnHFNiZ2vYl4McawvQ4lE1oAzE7NB9XcXV2sywA9p8h0mIgXt698Es_uwGj065jhKn3GAqFnwV_rMTwKyh4X0jLbaTOKB_7OyPOSh3ycMMHT6AAliEdxuZtB245Xfo1G4Y3ZIaNoDy8D7HdgA0snElbmTi6SfBDs1yZNHQZ8iEWvF2-9nIg2QPAOwWZ25-WHI8rdQDCd_cban7fM6Pe',
        }}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: SIZES.xl * 3,
    alignItems: 'center',
    opacity: 0.15,
  },
  logo: {
    width: 64,
    height: 64,
  },
});
