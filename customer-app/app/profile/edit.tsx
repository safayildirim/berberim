import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Screen } from '@/src/components/common/Screen';
import { AvatarSection } from '@/src/components/profile/edit-profile/AvatarSection';
import { FormSection } from '@/src/components/profile/edit-profile/FormSection';
import { ActionFooter } from '@/src/components/profile/edit-profile/ActionFooter';
import { useProfile } from '@/src/hooks/queries/useProfile';
import { useTheme } from '@/src/store/useThemeStore';

export default function EditProfileScreen() {
  const { isDark } = useTheme();
  const {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    avatar,
    isUpdating,
    saved,
    handleSave,
    handlePickImage,
    tenantName,
    t,
  } = useProfile();

  return (
    <Screen
      headerTitle={t('profile.editProfile')}
      showHeaderBack
      style={[
        styles.screen,
        { backgroundColor: isDark ? '#000000' : '#ffffff' },
      ]}
    >
      <KeyboardAvoidingView behavior="height" style={styles.flex}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <AvatarSection
            uri={avatar}
            onPress={handlePickImage}
            label={t('profile.changePhoto')}
          />

          <FormSection
            firstName={firstName}
            setFirstName={setFirstName}
            lastName={lastName}
            setLastName={setLastName}
          />

          {/* Spacer for button area */}
          <View style={{ height: 180 }} />
        </ScrollView>

        <ActionFooter
          onSave={handleSave}
          isSaving={isUpdating}
          saved={saved}
          tenantName={tenantName}
        />
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
    paddingBottom: 40,
  },
});
