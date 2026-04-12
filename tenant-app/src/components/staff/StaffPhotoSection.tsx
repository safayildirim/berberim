import { Camera, UserPlus } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SHADOWS, TYPOGRAPHY } from '@/src/constants/theme';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/src/hooks/useTheme';

type Props = {
  avatarUri?: string;
  onPickImage?: () => void;
  title?: string;
  subtitle?: string;
};

export const StaffPhotoSection = ({
  avatarUri,
  onPickImage,
  title,
  subtitle,
}: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.photoContainer}
        onPress={onPickImage}
        activeOpacity={0.8}
      >
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={[
              styles.avatarImage,
              { backgroundColor: colors.surfaceContainerHigh },
            ]}
          />
        ) : (
          <View
            style={[
              styles.avatarPlaceholder,
              {
                backgroundColor: colors.surfaceContainerHigh,
                borderColor: colors.border + '40',
              },
            ]}
          >
            <UserPlus size={48} color={colors.secondary} />
          </View>
        )}
        <View
          style={[
            styles.cameraBtn,
            { backgroundColor: colors.primary },
            SHADOWS.md,
          ]}
        >
          <Camera size={14} color={colors.onPrimary || '#FFFFFF'} />
        </View>
      </TouchableOpacity>
      <View style={styles.textContent}>
        <Text style={[styles.title, { color: colors.primary }]}>
          {title || t('settings.staff.create.teamIntegration')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.secondary }]}>
          {subtitle || t('settings.staff.create.teamIntegrationSub')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginBottom: 48,
  },
  photoContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContent: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.h2,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 20,
  },
});
