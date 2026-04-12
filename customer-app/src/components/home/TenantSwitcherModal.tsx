import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Plus, Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';
import { useSessionStore } from '@/src/lib/auth/session-store';
import { useTenantStore } from '@/src/store/useTenantStore';
import { tenantService } from '@/src/services/tenant.service';
import { TenantMembership } from '@/src/types';

interface TenantSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TenantSwitcherModal = ({
  visible,
  onClose,
}: TenantSwitcherModalProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { tenants, activeTenantId, setActiveTenant } = useSessionStore();
  const setTenantConfig = useTenantStore((s) => s.setConfig);
  const [search, setSearch] = useState('');

  const filteredTenants = useMemo(() => {
    const active = tenants.filter((m) => m.status === 'active');
    if (!search.trim()) return active;
    const q = search.trim().toLowerCase();
    return active.filter(
      (m) =>
        m.name.toLowerCase().includes(q) || m.slug.toLowerCase().includes(q),
    );
  }, [tenants, search]);

  const close = () => {
    onClose();
    setSearch('');
  };

  const handleSelectTenant = async (membership: TenantMembership) => {
    close();
    if (membership.tenant_id === activeTenantId) return;
    const config = await tenantService.getBootstrapConfig(membership.tenant_id);
    setTenantConfig(config);
    await setActiveTenant(membership.tenant_id, config);
    queryClient.invalidateQueries();
  };

  const handleAddShop = () => {
    close();
    router.push('/(tenant)/link-code');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Pressable style={styles.overlay} onPress={close}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.card }]}>
            <View style={styles.handle} />

            <Typography
              variant="h3"
              style={[styles.title, { color: colors.text }]}
            >
              {t('tenant.selectTitle', 'Dükkan Seç')}
            </Typography>

            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: colors.surfaceContainer,
                  borderColor: colors.outlineVariant,
                },
              ]}
            >
              <Search size={16} color={colors.onSurfaceVariant} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder={t('tenant.searchPlaceholder', 'Dükkan ara...')}
                placeholderTextColor={colors.onSurfaceVariant}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
              />
            </View>

            <View style={styles.list}>
              {filteredTenants.map((membership) => {
                const isActive = membership.tenant_id === activeTenantId;
                return (
                  <TouchableOpacity
                    key={membership.tenant_id}
                    style={[
                      styles.row,
                      {
                        backgroundColor: isActive
                          ? colors.surfaceContainer
                          : 'transparent',
                        borderColor: isActive
                          ? colors.outline
                          : colors.outlineVariant,
                      },
                    ]}
                    onPress={() => handleSelectTenant(membership)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.rowInfo}>
                      <Typography
                        variant="label"
                        style={{ color: colors.text }}
                      >
                        {membership.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        style={{ color: colors.onSurfaceVariant }}
                      >
                        {membership.slug}
                      </Typography>
                    </View>
                    {isActive && (
                      <View style={styles.badge}>
                        <Typography
                          variant="caption"
                          style={{ color: '#fff', fontWeight: '600' }}
                        >
                          {t('tenant.active', 'Aktif')}
                        </Typography>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[
                styles.addButton,
                {
                  borderColor: colors.outlineVariant,
                  backgroundColor: colors.surfaceContainerLow,
                },
              ]}
              onPress={handleAddShop}
            >
              <Plus size={18} color={colors.onSurfaceVariant} />
              <Typography
                variant="label"
                style={{ color: colors.onSurfaceVariant }}
              >
                {t('tenant.addAnother', 'Yeni Dükkan Ekle')}
              </Typography>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d1d5db',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#22c55e',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});
