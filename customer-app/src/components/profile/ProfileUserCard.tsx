import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Edit2 } from 'lucide-react-native';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';

interface ProfileUserCardProps {
  name: string;
  phone: string;
  avatarUrl?: string;
  onEdit: () => void;
}

export const ProfileUserCard = ({
  name,
  phone,
  avatarUrl,
  onEdit,
}: ProfileUserCardProps) => {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.outlineVariant,
        },
      ]}
    >
      <View style={styles.avatarContainer}>
        <Image
          source={{
            uri:
              avatarUrl ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
          }}
          style={[
            styles.avatar,
            { borderColor: isDark ? '#27272a' : '#f4f4f5' },
          ]}
        />
        <TouchableOpacity
          onPress={onEdit}
          style={[
            styles.editButton,
            { borderColor: isDark ? colors.background : '#fff' },
          ]}
        >
          <Edit2 size={12} color="#000" />
        </TouchableOpacity>
      </View>
      <View style={styles.info}>
        <Typography variant="h2" style={[styles.name, { color: colors.text }]}>
          {name}
        </Typography>
        <Typography variant="body" style={{ color: colors.onSurfaceVariant }}>
          {phone}
        </Typography>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#f59e0b',
    padding: 6,
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
});
