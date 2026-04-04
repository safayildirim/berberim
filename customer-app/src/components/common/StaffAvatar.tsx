import { User } from 'lucide-react-native';
import React from 'react';
import { Image, ImageStyle, StyleSheet, View, ViewStyle } from 'react-native';
import { COLORS } from '@/src/constants/theme';
import { Staff } from '@/src/types';
import { Typography } from '@/src/components/ui';

interface StaffAvatarProps {
  staff?: Staff | null;
  size?: number;
  style?: ViewStyle;
}

export const StaffAvatar: React.FC<StaffAvatarProps> = ({
  staff,
  size = 40,
  style,
}) => {
  const borderRadius = size / 2;
  const iconSize = size * 0.6;

  if (staff?.avatar) {
    return (
      <Image
        source={{ uri: staff.avatar }}
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius },
          style as ImageStyle,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        { width: size, height: size, borderRadius },
        style,
      ]}
    >
      {staff?.first_name ? (
        <Typography
          variant="label"
          style={{ fontSize: size * 0.4, color: COLORS.secondary }}
        >
          {staff.first_name.charAt(0).toUpperCase()}
        </Typography>
      ) : (
        <User size={iconSize} color={COLORS.secondary} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: COLORS.muted,
  },
  placeholder: {
    backgroundColor: COLORS.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
