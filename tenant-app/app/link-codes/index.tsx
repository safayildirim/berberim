import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Share,
} from 'react-native';
import { Link2, Plus, Copy, Trash2, Clock } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Screen } from '@/src/components/common/Screen';
import { adminService } from '@/src/services/admin.service';
import { LinkCode } from '@/src/types';

const C = {
  bg: '#f7f9fb',
  card: '#ffffff',
  text: '#1c1b1b',
  sub: '#6b7280',
  border: '#e5e7eb',
  primary: '#2D3142',
  error: '#ef4444',
  white: '#ffffff',
  muted: '#f3f4f6',
  codeBg: '#eef0ff',
};

export default function LinkCodesScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [newCode, setNewCode] = useState<string | null>(null);

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ['link-codes'],
    queryFn: () => adminService.listLinkCodes(),
  });

  const generate = useMutation({
    mutationFn: () => adminService.generateLinkCode(1, 24),
    onSuccess: (d) => {
      setNewCode(d.code);
      qc.invalidateQueries({ queryKey: ['link-codes'] });
    },
  });

  const revoke = useMutation({
    mutationFn: (id: string) => adminService.revokeLinkCode(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['link-codes'] }),
  });

  const copyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert(t('linkCodes.copied', 'Kopyalandı!'));
  };

  const shareCode = async (code: string) => {
    await Share.share({
      message: `Berberim uygulamasına bağlanmak için bu kodu kullan: ${code}`,
    });
  };

  const confirmRevoke = (id: string) => {
    Alert.alert(
      t('linkCodes.revokeTitle', 'Kodu İptal Et'),
      t('linkCodes.revokeMessage', 'Bu kod artık kullanılamaz olacak.'),
      [
        { text: t('common.cancel', 'İptal'), style: 'cancel' },
        {
          text: t('common.confirm', 'Onayla'),
          style: 'destructive',
          onPress: () => revoke.mutate(id),
        },
      ],
    );
  };

  const isActive = (c: LinkCode) =>
    !c.revoked_at &&
    new Date(c.expires_at) > new Date() &&
    c.current_uses < c.max_uses;

  const renderItem = ({ item }: { item: LinkCode }) => {
    const active = isActive(item);
    const hoursLeft = Math.max(
      0,
      Math.round((new Date(item.expires_at).getTime() - Date.now()) / 3600000),
    );

    return (
      <View style={[s.card, !active && s.cardDim]}>
        <View style={s.cardTop}>
          <View style={s.codeRow}>
            <Link2 size={16} color={active ? C.primary : C.sub} />
            <Text style={[s.codeText, !active && { color: C.sub }]}>
              {item.code}
            </Text>
          </View>
          {active && (
            <View style={s.actions}>
              <TouchableOpacity
                onPress={() => copyCode(item.code)}
                style={s.actionBtn}
              >
                <Copy size={18} color={C.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => confirmRevoke(item.id)}
                style={s.actionBtn}
              >
                <Trash2 size={18} color={C.error} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View style={s.cardBottom}>
          <View style={s.metaRow}>
            <Clock size={12} color={C.sub} />
            <Text style={s.metaText}>
              {active
                ? `${hoursLeft} saat kaldı`
                : item.revoked_at
                  ? t('linkCodes.revoked', 'İptal edildi')
                  : t('linkCodes.expired', 'Süresi doldu')}
            </Text>
          </View>
          <Text style={s.metaText}>
            {item.current_uses}/{item.max_uses} kullanım
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Screen
      style={s.container}
      withPadding={false}
      transparentStatusBar
      headerTitle={t('linkCodes.title', 'Bağlantı Kodları')}
      showHeaderBack
    >
      <FlatList
        data={codes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <View style={s.empty}>
              <Link2 size={48} color={C.border} />
              <Text style={s.emptyText}>
                {t('linkCodes.empty', 'Henüz bağlantı kodu oluşturulmadı.')}
              </Text>
            </View>
          ) : null
        }
      />

      <TouchableOpacity
        style={[s.fab, { bottom: 24 + insets.bottom }]}
        onPress={() => generate.mutate()}
        activeOpacity={0.9}
        disabled={generate.isPending}
      >
        <Plus size={28} color={C.white} />
      </TouchableOpacity>

      <Modal
        visible={!!newCode}
        transparent
        animationType="fade"
        onRequestClose={() => setNewCode(null)}
      >
        <View style={s.overlay}>
          <View style={s.modal}>
            <Link2 size={32} color={C.primary} />
            <Text style={s.modalTitle}>
              {t('linkCodes.generated', 'Kod Oluşturuldu')}
            </Text>
            <Text style={s.modalCode}>{newCode}</Text>
            <Text style={s.modalHint}>
              {t(
                'linkCodes.generatedHint',
                'Bu kodu müşterinizle paylaşın. 24 saat geçerlidir.',
              )}
            </Text>
            <View style={s.modalBtns}>
              <TouchableOpacity
                style={s.modalBtn}
                onPress={() => newCode && copyCode(newCode)}
              >
                <Copy size={18} color={C.white} />
                <Text style={s.modalBtnText}>
                  {t('linkCodes.copy', 'Kopyala')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, s.modalBtnSecondary]}
                onPress={() => newCode && shareCode(newCode)}
              >
                <Text style={[s.modalBtnText, { color: C.primary }]}>
                  {t('linkCodes.share', 'Paylaş')}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setNewCode(null)}>
              <Text style={s.modalDismiss}>{t('common.close', 'Kapat')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: C.bg },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardDim: { opacity: 0.5 },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  codeText: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 4,
    color: C.text,
  },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: C.muted,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: C.sub },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 16,
  },
  emptyText: { fontSize: 15, color: C.sub, textAlign: 'center' },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: C.text,
    marginTop: 12,
  },
  modalCode: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 6,
    color: C.primary,
    marginTop: 20,
    marginBottom: 8,
  },
  modalHint: {
    fontSize: 14,
    color: C.sub,
    textAlign: 'center',
    marginVertical: 16,
    lineHeight: 20,
  },
  modalBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  modalBtnSecondary: { backgroundColor: C.muted },
  modalBtnText: { fontSize: 15, fontWeight: '600', color: C.white },
  modalDismiss: {
    fontSize: 14,
    color: C.sub,
    marginTop: 16,
    textAlign: 'center',
  },
});
