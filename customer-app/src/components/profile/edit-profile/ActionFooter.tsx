import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';
import { SIZES } from '@/src/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface ActionFooterProps {
  onSave: () => void;
  isSaving: boolean;
  saved: boolean;
  tenantName: string;
}

export const ActionFooter: React.FC<ActionFooterProps> = ({
  onSave,
  isSaving,
  saved,
  tenantName,
}) => {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  const buttonBg = saved ? '#10b981' : isDark ? '#ffffff' : '#18181b';

  const textColor = saved ? '#ffffff' : isDark ? '#000000' : '#ffffff';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={
          isDark
            ? ['transparent', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,1)']
            : ['transparent', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,1)']
        }
        style={styles.gradient}
      >
        <TouchableOpacity
          onPress={onSave}
          disabled={isSaving || saved}
          activeOpacity={0.8}
          style={[
            styles.button,
            { backgroundColor: buttonBg },
            saved && styles.buttonSuccess,
          ]}
        >
          {isSaving ? (
            <ActivityIndicator color={textColor} />
          ) : saved ? (
            <View style={styles.row}>
              <Check size={22} color={textColor} strokeWidth={3} />
              <Typography style={[styles.buttonText, { color: textColor }]}>
                {t('common.done')}
              </Typography>
            </View>
          ) : (
            <Typography style={[styles.buttonText, { color: textColor }]}>
              {t('profile.saveChanges')}
            </Typography>
          )}
        </TouchableOpacity>

        <Typography
          variant="caption"
          align="center"
          style={[styles.disclaimer, { color: isDark ? '#71717a' : '#a1a1aa' }]}
        >
          {t('profile.saveChangesDesc', { name: tenantName })}
        </Typography>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  gradient: {
    padding: SIZES.lg,
    paddingTop: 48,
    paddingBottom: 40,
  },
  button: {
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonSuccess: {
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disclaimer: {
    marginTop: 20,
    lineHeight: 18,
    fontWeight: '500',
    paddingHorizontal: 16,
  },
});
