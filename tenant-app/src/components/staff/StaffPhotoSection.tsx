import { Camera, UserPlus } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SHADOWS } from '@/src/constants/theme';
import { useTranslation } from 'react-i18next';

export const StaffPhotoSection = () => {
  const { t } = useTranslation();
  return (
    <View style={styles.section}>
      <View style={styles.photoContainer}>
        <View style={styles.avatarPlaceholder}>
          <UserPlus size={48} color={COLORS.secondary} />
        </View>
        <TouchableOpacity
          style={[styles.cameraBtn, SHADOWS.md]}
          activeOpacity={0.9}
        >
          <Camera size={14} color={COLORS.white} />
        </TouchableOpacity>
      </View>
      <View style={styles.textContent}>
        <Text style={styles.title}>
          {t('settings.staff.create.teamIntegration')}
        </Text>
        <Text style={styles.subtitle}>
          {t('settings.staff.create.teamIntegrationSub')}
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
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.outlineVariant + '40',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: 'Manrope',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 20,
  },
});
