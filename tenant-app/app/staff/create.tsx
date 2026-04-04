import { LinearGradient } from 'expo-linear-gradient';
import { UserPlus } from 'lucide-react-native';
import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../../src/components/common/Screen';
import { AccountAccessSection } from '../../src/components/staff/AccountAccessSection';
import { AddStaffHeader } from '../../src/components/staff/AddStaffHeader';
import { PersonalInfoSection } from '../../src/components/staff/PersonalInfoSection';
import { StaffPhotoSection } from '../../src/components/staff/StaffPhotoSection';
import { COLORS, SHADOWS } from '../../src/constants/theme';
import { useAddStaff } from '../../src/hooks/staff/useAddStaff';
import { useSessionStore } from '../../src/store/useSessionStore';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

export default function AddStaffScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const { isAdmin } = useSessionStore();
  const { form, ui, actions } = useAddStaff();

  React.useEffect(() => {
    if (!isAdmin()) {
      router.replace('/staff');
    }
  }, [isAdmin, router]);

  return (
    <Screen style={styles.container} withPadding={false} transparentStatusBar>
      <AddStaffHeader />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
        >
          <StaffPhotoSection />

          <PersonalInfoSection
            firstName={form.firstName}
            setFirstName={form.setFirstName}
            lastName={form.lastName}
            setLastName={form.setLastName}
            email={form.email}
            setEmail={form.setEmail}
          />

          <AccountAccessSection
            password={form.password}
            setPassword={form.setPassword}
            showPassword={ui.showPassword}
            togglePasswordVisibility={ui.togglePasswordVisibility}
            role={form.role}
            setRole={form.setRole}
          />

          {/* Submit Action */}
          <View style={styles.submitContainer}>
            <TouchableOpacity
              onPress={actions.handleSubmit}
              disabled={ui.isSubmitting}
              activeOpacity={0.9}
              style={styles.submitBtnWrapper}
            >
              <LinearGradient
                colors={[COLORS.primary, '#1b263b']}
                style={styles.submitBtn}
              >
                {ui.isSubmitting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <View style={styles.submitBtnContent}>
                    <Text style={styles.submitBtnText}>
                      {t('settings.staff.create.submit')}
                    </Text>
                    <UserPlus
                      size={20}
                      color={COLORS.white}
                      strokeWidth={2.5}
                    />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.footerHint}>
              {t('settings.staff.create.invitationHint')}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  submitContainer: {
    marginTop: 8,
  },
  submitBtnWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  submitBtn: {
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  submitBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
    fontFamily: 'Manrope',
  },
  footerHint: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 24,
    opacity: 0.8,
  },
});
