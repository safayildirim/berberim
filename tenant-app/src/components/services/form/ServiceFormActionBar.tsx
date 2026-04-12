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
import { useTheme } from '@/src/hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';

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
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.actionBar,
        {
          paddingBottom: Math.max(insets.bottom, 20),
          backgroundColor: colors.background,
          borderTopColor: colors.border + '15',
        },
      ]}
    >
      <TouchableOpacity
        onPress={onSave}
        disabled={isSubmitting}
        activeOpacity={0.9}
        style={styles.saveBtnWrapper}
      >
        <LinearGradient
          colors={[colors.primary, isDark ? '#1b263b' : colors.primary + 'E6']}
          style={styles.saveBtn}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.onPrimary || '#ffffff'} />
          ) : (
            <View style={styles.btnContent}>
              <Save size={18} color={colors.onPrimary || '#ffffff'} />
              <Text
                style={[
                  styles.saveBtnText,
                  { color: colors.onPrimary || '#ffffff' },
                ]}
              >
                {t('serviceForm.saveService')}
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  actionBar: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  saveBtnWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  saveBtn: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
