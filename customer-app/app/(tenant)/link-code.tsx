import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/src/components/common/Screen';
import { Button, Typography } from '@/src/components/ui';
import { COLORS, SIZES } from '@/src/constants/theme';
import { tenantService } from '@/src/services/tenant.service';
import { useTenantStore } from '@/src/store/useTenantStore';
import { useSessionStore } from '@/src/lib/auth/session-store';

const CODE_LENGTH = 6;

export default function LinkCodeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const setTenants = useSessionStore((s) => s.setTenants);
  const setActiveTenant = useSessionStore((s) => s.setActiveTenant);
  const setTenantConfig = useTenantStore((s) => s.setConfig);
  const tenants = useSessionStore((s) => s.tenants);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const claimMutation = useMutation({
    mutationFn: (linkCode: string) => tenantService.claimLinkCode(linkCode),
    onSuccess: async (membership) => {
      // Refresh tenant list
      const updatedTenants = await tenantService.listMyTenants();
      setTenants(updatedTenants);

      // Load this tenant's config and set as active
      const config = await tenantService.getBootstrapConfig(
        membership.tenant_id,
      );
      setTenantConfig(config);
      await setActiveTenant(membership.tenant_id, config);

      // Invalidate all queries to reload with new tenant context
      queryClient.invalidateQueries();

      // Navigate to main app
      router.replace('/(tabs)');
    },
    onError: (err: any) => {
      setError(
        err?.message ||
          t(
            'tenant.linkCodeInvalid',
            'Kod geçersiz, süresi dolmuş veya zaten kullanılmış.',
          ),
      );
    },
  });

  const handleSubmit = () => {
    setError(null);
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== CODE_LENGTH) {
      setError(t('tenant.linkCodeLength', 'Kod 6 karakter olmalıdır.'));
      return;
    }
    claimMutation.mutate(trimmed);
  };

  const canGoBack = tenants.length > 0;

  return (
    <Screen style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Typography variant="h2" align="center">
            {t('tenant.linkTitle', 'Berber Dükkanına Bağlan')}
          </Typography>
          <Typography
            variant="body"
            color={COLORS.secondary}
            align="center"
            style={styles.subtitle}
          >
            {t(
              'tenant.linkSubtitle',
              'Berberinizden aldığınız 6 haneli kodu girin.',
            )}
          </Typography>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={(text) => {
              setCode(text.toUpperCase());
              setError(null);
            }}
            placeholder="ABC123"
            placeholderTextColor={COLORS.border}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={CODE_LENGTH}
            textAlign="center"
          />
          {error && (
            <Typography variant="caption" color={COLORS.error} align="center">
              {error}
            </Typography>
          )}
        </View>

        <Button
          title={t('tenant.linkButton', 'Bağlan')}
          onPress={handleSubmit}
          disabled={code.trim().length !== CODE_LENGTH}
          loading={claimMutation.isPending}
          style={styles.button}
        />

        {canGoBack && (
          <Button
            title={t('common.back', 'Geri')}
            onPress={() => router.back()}
            variant="ghost"
            style={styles.backButton}
          />
        )}
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
  header: {
    marginBottom: SIZES.xl,
  },
  subtitle: {
    marginTop: SIZES.sm,
  },
  inputContainer: {
    marginBottom: SIZES.lg,
    gap: SIZES.sm,
  },
  codeInput: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    backgroundColor: COLORS.card,
    color: COLORS.text,
  },
  button: {
    marginBottom: SIZES.md,
  },
  backButton: {
    marginBottom: SIZES.md,
  },
});
