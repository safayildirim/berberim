import React from 'react';
import { StyleSheet, View, ScrollView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/src/components/common/Screen';
import { Button, Typography } from '@/src/components/ui';
import { useSessionStore } from '@/src/lib/auth/session-store';
import { useTenantStore } from '@/src/store/useTenantStore';
import { tenantService } from '@/src/services/tenant.service';
import { useQueryClient } from '@tanstack/react-query';
import { TenantMembership } from '@/src/types';
import { useTheme } from '@/src/store/useThemeStore';
import { TenantCard } from '@/src/components/tenant/TenantCard';

export default function SelectTenantScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isDark } = useTheme();
  const queryClient = useQueryClient();
  const tenants = useSessionStore((s) => s.tenants);
  const setActiveTenant = useSessionStore((s) => s.setActiveTenant);
  const setTenantConfig = useTenantStore((s) => s.setConfig);

  const handleSelectTenant = async (membership: TenantMembership) => {
    const config = await tenantService.getBootstrapConfig(membership.tenant_id);
    setTenantConfig(config);
    await setActiveTenant(membership.tenant_id, config);
    queryClient.invalidateQueries();
    router.replace('/(tabs)');
  };

  return (
    <Screen
      style={[
        styles.container,
        { backgroundColor: isDark ? '#000000' : '#ffffff' },
      ]}
      transparentStatusBar
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Typography
            variant="caption"
            style={[styles.label, { color: isDark ? '#71717a' : '#a1a1aa' }]}
          >
            {t('tenant.selectLabel', 'Dükkan Seçim').toUpperCase()}
          </Typography>
          <Typography
            variant="h1"
            style={[styles.title, { color: isDark ? '#ffffff' : '#18181b' }]}
          >
            {t('tenant.selectTitle', 'Dükkan Seç')}
          </Typography>
          <Typography
            style={[styles.subtitle, { color: isDark ? '#a1a1aa' : '#71717a' }]}
          >
            {t('tenant.selectSubtitle', 'Hangi berbere gitmek istiyorsun?')}
          </Typography>
        </View>

        <View style={styles.list}>
          {tenants
            .filter((m) => m.status === 'active')
            .map((membership) => (
              <TenantCard
                key={membership.tenant_id}
                membership={membership}
                onPress={() => handleSelectTenant(membership)}
              />
            ))}
        </View>

        <View style={styles.footer}>
          <Button
            title={t('tenant.addAnother', 'Yeni Dükkan Ekle')}
            onPress={() => router.push('/(tenant)/link-code')}
            variant="outline"
            style={[
              styles.addButton,
              {
                borderColor: isDark ? '#27272a' : '#e4e4e7',
                backgroundColor: isDark ? 'transparent' : '#f4f4f5',
              },
            ]}
            titleStyle={{ color: isDark ? '#d4d4d8' : '#71717a' }}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    flexGrow: 1,
  },
  header: {
    marginBottom: 40,
  },
  label: {
    fontWeight: '800',
    letterSpacing: 2.5,
    marginBottom: 12,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    maxWidth: 280,
  },
  list: {
    flex: 1,
  },
  footer: {
    marginTop: 40,
  },
  addButton: {
    height: 64,
    borderRadius: 20,
    borderWidth: 1.5,
  },
});
