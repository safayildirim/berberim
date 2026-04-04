import { Save } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SHADOWS } from '@/src/constants/theme';

interface Props {
  onSave: () => void;
  isSubmitting: boolean;
}

export const ServiceFormActionBar: React.FC<Props> = ({
  onSave,
  isSubmitting,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.actionBar, { paddingBottom: 20 + insets.bottom }]}>
      <TouchableOpacity
        style={styles.saveBtn}
        onPress={onSave}
        disabled={isSubmitting}
        activeOpacity={0.9}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <View style={styles.btnContent}>
            <Save size={18} color="#ffffff" />
            <Text style={styles.saveBtnText}>
              {t('serviceForm.saveService')}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: 'transparent',
  },
  saveBtn: {
    backgroundColor: '#051125',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
