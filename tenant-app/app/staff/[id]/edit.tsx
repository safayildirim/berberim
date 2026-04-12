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
import { PersonalInfoSection } from '@/src/components/staff/PersonalInfoSection';
import { StaffPhotoSection } from '@/src/components/staff/StaffPhotoSection';
import { SystemRoleSection } from '@/src/components/staff/SystemRoleSection';
import { SHADOWS, TYPOGRAPHY } from '@/src/constants/theme';
import { useManageStaff } from '@/src/hooks/staff/useManageStaff';
import { useSessionStore } from '@/src/store/useSessionStore';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/src/hooks/useTheme';

export default function ManageStaffScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isAdmin } = useSessionStore();
  const { form, ui, actions, staff } = useManageStaff(id!);

  React.useEffect(() => {
    if (!isAdmin()) {
      router.replace('/staff');
    }
  }, [isAdmin, router]);

  if (ui.isLoading) {
    return (
      <Screen
        style={[styles.container, { backgroundColor: colors.background }]}
        withPadding={false}
      >
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!staff) {
    return (
      <Screen
        style={[styles.container, { backgroundColor: colors.background }]}
        withPadding={false}
        headerTitle={t('settings.staff.manage.title')}
        showHeaderBack={true}
      >
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {t('settings.staff.manage.notFound')}
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.retryText, { color: colors.onPrimary }]}>
              {t('common.back')}
            </Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      style={[styles.container, { backgroundColor: colors.background }]}
      withPadding={false}
      transparentStatusBar
      headerTitle={t('settings.staff.manage.title')}
      showHeaderBack={true}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <StaffPhotoSection
            avatarUri={form.avatar || undefined}
            onPickImage={actions.handlePickImage}
          />

          <PersonalInfoSection
            firstName={form.firstName}
            setFirstName={form.setFirstName}
            lastName={form.lastName}
            setLastName={form.setLastName}
            email={form.email}
            setEmail={form.setEmail}
          />

          <SystemRoleSection role={form.role} setRole={form.setRole} />
        </ScrollView>

        {/* Sticky Update Action */}
        <View
          style={[
            styles.stickyFooter,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border + '15',
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          <TouchableOpacity
            onPress={actions.handleUpdate}
            disabled={ui.isSubmitting}
            activeOpacity={0.9}
            style={styles.submitBtnWrapper}
          >
            <LinearGradient
              colors={[
                colors.primary,
                isDark ? '#1b263b' : colors.primary + 'E6',
              ]}
              style={styles.submitBtn}
            >
              {ui.isSubmitting ? (
                <ActivityIndicator
                  size="small"
                  color={colors.onPrimary || '#FFFFFF'}
                />
              ) : (
                <View style={styles.submitBtnContent}>
                  <Text
                    style={[styles.submitBtnText, { color: colors.onPrimary }]}
                  >
                    {t('settings.staff.manage.update')}
                  </Text>
                  <Save size={20} color={colors.onPrimary} strokeWidth={2.5} />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={[styles.footerHint, { color: colors.secondary }]}>
            {t('settings.staff.manage.updateHint')}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  stickyFooter: {
    paddingTop: 16,
    paddingHorizontal: 24,
    borderTopWidth: 1,
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
    ...TYPOGRAPHY.h3,
    fontSize: 18,
    fontWeight: '800',
  },
  footerHint: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
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
    ...TYPOGRAPHY.body,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    fontWeight: 'bold',
  },
});
