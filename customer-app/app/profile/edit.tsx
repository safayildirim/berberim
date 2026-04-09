import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '@/src/components/common/Screen';
import {
  AvatarEdit,
  FormField,
} from '@/src/components/profile/EditProfileComponents';
import { Button, Typography } from '@/src/components/ui';
import { COLORS, SIZES } from '@/src/constants/theme';
import { useProfile } from '@/src/hooks/queries/useProfile';

export default function EditProfileScreen() {
  const {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    avatar,
    primaryColor,
    isUpdating,
    handleSave,
    handlePickImage,
    tenantName,
    t,
  } = useProfile();

  return (
    <Screen
      headerTitle={t('profile.editProfile')}
      showHeaderBack
      scrollable
      showProfile={false}
    >
      <View style={styles.container}>
        <AvatarEdit
          uri={avatar}
          onPress={handlePickImage}
          primaryColor={primaryColor}
          label={t('profile.changePhoto')}
        />

        <View style={styles.form}>
          <FormField
            label={t('profile.firstName')}
            value={firstName}
            onChangeText={setFirstName}
            placeholder={t('profile.firstName')}
          />
          <FormField
            label={t('profile.lastName')}
            value={lastName}
            onChangeText={setLastName}
            placeholder={t('profile.lastName')}
          />
        </View>

        <View style={styles.footer}>
          <Button
            title={t('profile.saveChanges')}
            onPress={handleSave}
            loading={isUpdating}
            size="lg"
            style={[styles.saveButton, { backgroundColor: COLORS.primary }]}
          />
          <Typography
            variant="caption"
            align="center"
            color={COLORS.secondary}
            style={styles.disclaimer}
          >
            {t('profile.saveChangesDesc', { name: tenantName })}
          </Typography>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.xl,
    paddingBottom: 100, // Enough space for bottom content
  },
  form: {
    marginTop: SIZES.lg,
  },
  footer: {
    marginTop: 48,
  },
  saveButton: {
    borderRadius: 12,
    height: 56,
  },
  disclaimer: {
    marginTop: 24,
    paddingHorizontal: 24,
    lineHeight: 18,
    opacity: 0.7,
  },
});
