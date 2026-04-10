import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera } from 'lucide-react-native';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';
import { SIZES } from '@/src/constants/theme';

interface AvatarSectionProps {
  uri?: string;
  onPress: () => void;
  label: string;
}

export const AvatarSection: React.FC<AvatarSectionProps> = ({
  uri,
  onPress,
  label,
}) => {
  const { isDark } = useTheme();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={styles.avatarWrapper}
      >
        <LinearGradient
          colors={isDark ? ['#10b981', '#064e3b'] : ['#10b981', '#34d399']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBorder}
        >
          <Image
            source={{
              uri:
                uri ||
                'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=256&h=256&fit=crop',
            }}
            style={[styles.avatar, { borderColor: isDark ? '#000' : '#fff' }]}
          />
        </LinearGradient>

        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.8}
          style={[
            styles.cameraButton,
            {
              backgroundColor: isDark ? '#27272a' : '#f4f4f5',
              borderColor: isDark ? '#000' : '#fff',
            },
          ]}
        >
          <Camera size={18} color="#10b981" strokeWidth={2.5} />
        </TouchableOpacity>
      </TouchableOpacity>

      <TouchableOpacity onPress={onPress}>
        <Typography
          variant="label"
          style={[styles.changeText, { color: isDark ? '#a1a1aa' : '#71717a' }]}
        >
          {label}
        </Typography>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: SIZES.xl,
    marginBottom: SIZES.xl * 1.5,
  },
  avatarWrapper: {
    position: 'relative',
  },
  gradientBorder: {
    width: 132,
    height: 132,
    borderRadius: 66,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 126,
    height: 126,
    borderRadius: 63,
    borderWidth: 4,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  changeText: {
    marginTop: 20,
    fontWeight: '600',
  },
});
