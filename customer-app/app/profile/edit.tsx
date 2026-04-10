import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/src/components/common/Screen';
import {
  AvatarEdit,
  FormField,
} from '@/src/components/profile/EditProfileComponents';
import { Button, Typography } from '@/src/components/ui';
import { SIZES } from '@/src/constants/theme';
import { useProfile } from '@/src/hooks/queries/useProfile';
import { useTheme } from '@/src/store/useThemeStore';

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
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
      style={styles.screen}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
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
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.outlineVariant,
              paddingBottom: Math.max(insets.bottom, SIZES.md),
            },
          ]}
        >
          <Button
            title={t('profile.saveChanges')}
            onPress={handleSave}
            loading={isUpdating}
            size="lg"
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            titleStyle={{ color: colors.onPrimary }}
          />
          <Typography
            variant="caption"
            align="center"
            style={[styles.disclaimer, { color: colors.secondary }]}
          >
            {t('profile.saveChangesDesc', { name: tenantName })}
          </Typography>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.lg,
    paddingTop: SIZES.xl,
    paddingBottom: SIZES.xl,
  },
  form: {
    marginTop: SIZES.sm,
  },
  footer: {
    padding: SIZES.lg,
    borderTopWidth: 1,
  },
  saveButton: {
    borderRadius: 16,
    height: 64,
  },
  disclaimer: {
    marginTop: 16,
    paddingHorizontal: 24,
    lineHeight: 18,
    opacity: 0.8,
  },
});
