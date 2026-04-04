import { Pencil } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { COLORS, SHADOWS, SIZES } from '@/src/constants/theme';
import { CustomerProfile } from '@/src/types';
import { Typography } from '@/src/components/ui';

interface ProfileHeaderProps {
  user: CustomerProfile;
  onEdit: () => void;
  primaryColor: string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  onEdit,
  primaryColor,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <View style={[styles.avatarWrapper, SHADOWS.md]}>
          <Image
            source={{
              uri:
                user?.profile.avatar_url ||
                'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
            }}
            style={styles.avatar}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.editButton,
            { backgroundColor: primaryColor },
            SHADOWS.sm,
          ]}
          onPress={onEdit}
          activeOpacity={0.8}
        >
          <Pencil size={16} color={COLORS.white} pointerEvents="none" />
        </TouchableOpacity>
      </View>
      <Typography variant="h1" style={styles.name}>
        {user?.profile.first_name} {user?.profile.last_name}
      </Typography>
      <Typography
        variant="body"
        color={COLORS.onSurfaceVariant}
        style={styles.phone}
      >
        {user?.profile.phone_number}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: SIZES.xl,
    paddingHorizontal: SIZES.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SIZES.md,
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: COLORS.white,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceContainer,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  phone: {
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },
});
