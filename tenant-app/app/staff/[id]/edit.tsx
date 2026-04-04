import { LinearGradient } from 'expo-linear-gradient';
import { Save } from 'lucide-react-native';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/src/components/common/Screen';
import { ManageStaffHeader } from '@/src/components/staff/ManageStaffHeader';
import { PersonalInfoSection } from '@/src/components/staff/PersonalInfoSection';
import { StaffPhotoSection } from '@/src/components/staff/StaffPhotoSection';
import { SystemRoleSection } from '@/src/components/staff/SystemRoleSection';
import { COLORS, SHADOWS } from '@/src/constants/theme';
import { useManageStaff } from '@/src/hooks/staff/useManageStaff';
import { useSessionStore } from '@/src/store/useSessionStore';
import { useTranslation } from 'react-i18next';

export default function ManageStaffScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const { isAdmin } = useSessionStore();
  const { form, ui, actions, staff } = useManageStaff(id!);

  React.useEffect(() => {
    if (!isAdmin()) {
      router.replace('/staff');
    }
  }, [isAdmin, router]);

  if (ui.isLoading) {
    return (
      <Screen style={styles.container} withPadding={false}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </Screen>
    );
  }

  if (!staff) {
    return (
      <Screen style={styles.container} withPadding={false}>
        <ManageStaffHeader onDelete={() => {}} />
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {t('settings.staff.manage.notFound')}
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.retryText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container} withPadding={false} transparentStatusBar>
      <ManageStaffHeader onDelete={actions.handleDelete} />

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

          <SystemRoleSection role={form.role} setRole={form.setRole} />

          {/* Update Action */}
          <View style={styles.submitContainer}>
            <TouchableOpacity
              onPress={actions.handleUpdate}
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
                      {t('settings.staff.manage.update')}
                    </Text>
                    <Save size={20} color={COLORS.white} strokeWidth={2.5} />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.footerHint}>
              {t('settings.staff.manage.updateHint')}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.secondary,
    fontWeight: '600',
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});
