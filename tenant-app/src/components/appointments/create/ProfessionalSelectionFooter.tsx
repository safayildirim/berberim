import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Scissors } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { TYPOGRAPHY, SIZES, SHADOWS } from '@/src/constants/theme';
import { Staff } from '@/src/types';
import { useTheme } from '@/src/hooks/useTheme';

interface Props {
  selectedStaff: Staff | null;
  onContinue: () => void;
}

export const ProfessionalSelectionFooter = ({
  selectedStaff,
  onContinue,
}: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background + 'F2',
          borderTopColor: colors.border + '20',
        },
      ]}
    >
      {selectedStaff && (
        <View
          style={[
            styles.quickBar,
            { backgroundColor: colors.surfaceContainerHigh },
          ]}
        >
          <View style={styles.leftInfo}>
            <Scissors size={14} color={colors.secondary} />
            <Text style={[styles.selectedLabel, { color: colors.secondary }]}>
              {t('appointmentCreate.selected', {
                name: `${selectedStaff.first_name} ${selectedStaff.last_name}`,
              })}
            </Text>
          </View>
          <Text style={[styles.subtext, { color: colors.primary }]}>
            {t('appointmentCreate.professionalSelected')}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: selectedStaff
              ? colors.primary
              : colors.outlineVariant,
            opacity: selectedStaff ? 1 : 0.6,
          },
          selectedStaff && SHADOWS.md,
        ]}
        onPress={onContinue}
        disabled={!selectedStaff}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
          {t('appointmentCreate.continueToSelection')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SIZES.lg,
    paddingTop: SIZES.md,
    borderTopWidth: 1,
  },
  quickBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: 30, // Full rounded
    marginBottom: SIZES.md,
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
  },
  selectedLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    fontSize: 10,
  },
  subtext: {
    ...TYPOGRAPHY.caption,
    fontWeight: '900',
    fontSize: 10,
  },
  button: {
    height: 64,
    borderRadius: SIZES.radius + 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
  },
});
