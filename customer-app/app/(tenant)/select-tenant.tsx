import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/src/components/common/Screen';
import { Button, Typography } from '@/src/components/ui';
import { COLORS, IMAGES, SHADOWS, SIZES } from '@/src/constants/theme';
import { useSessionStore } from '@/src/lib/auth/session-store';
import { useTenantStore } from '@/src/store/useTenantStore';
import { tenantService } from '@/src/services/tenant.service';
import { useQueryClient } from '@tanstack/react-query';
import { TenantMembership } from '@/src/types';

export default function SelectTenantScreen() {
  const { t } = useTranslation();
  const router = useRouter();
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
    <Screen style={styles.container}>
      <View style={styles.content}>
        <Typography variant="h2" align="center">
          {t('tenant.selectTitle', 'Dükkan Seç')}
        </Typography>
        <Typography
          variant="body"
          color={COLORS.secondary}
          align="center"
          style={styles.subtitle}
        >
          {t('tenant.selectSubtitle', 'Hangi berbere gitmek istiyorsun?')}
        </Typography>

        <View style={styles.list}>
          {tenants
            .filter((m) => m.status === 'active')
            .map((membership) => (
              <Pressable
                key={membership.tenant_id}
                style={styles.tenantCard}
                onPress={() => handleSelectTenant(membership)}
              >
                <Image
                  source={{
                    uri: membership.logo_url || IMAGES.defaultLogo,
                  }}
                  style={styles.tenantLogo}
                />
                <View style={styles.tenantInfo}>
                  <Typography variant="label">{membership.name}</Typography>
                  <Typography variant="caption" color={COLORS.secondary}>
                    {membership.slug}
                  </Typography>
                </View>
              </Pressable>
            ))}
        </View>

        <Button
          title={t('tenant.addAnother', 'Yeni Dükkan Ekle')}
          onPress={() => router.push('/(tenant)/link-code')}
          variant="outline"
          style={styles.addButton}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: SIZES.padding * 1.5,
  },
  subtitle: {
    marginTop: SIZES.sm,
    marginBottom: SIZES.xl,
  },
  list: {
    gap: SIZES.sm,
    marginBottom: SIZES.lg,
  },
  tenantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.md,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  tenantLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.muted,
  },
  tenantInfo: {
    marginLeft: SIZES.md,
    flex: 1,
  },
  addButton: {
    marginTop: SIZES.sm,
  },
});
