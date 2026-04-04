import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Scissors } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, TYPOGRAPHY, SIZES, SHADOWS } from '@/src/constants/theme';
import { Staff } from '@/src/types';

interface Props {
  selectedStaff: Staff | null;
  onContinue: () => void;
}

export const ProfessionalSelectionFooter = ({
  selectedStaff,
  onContinue,
}: Props) => {
  const { t } = useTranslation();

  return (
    <View style={[styles.container]}>
      {selectedStaff && (
        <View style={styles.quickBar}>
          <View style={styles.leftInfo}>
            <Scissors size={14} color={COLORS.secondary} />
            <Text style={styles.selectedLabel}>
              {t('appointmentCreate.selected', {
                name: `${selectedStaff.first_name} ${selectedStaff.last_name}`,
              })}
            </Text>
          </View>
          <Text style={styles.subtext}>
            {t('appointmentCreate.professionalSelected')}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          !selectedStaff && styles.disabledButton,
          selectedStaff && SHADOWS.md,
        ]}
        onPress={onContinue}
        disabled={!selectedStaff}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  quickBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainerHigh,
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
    color: COLORS.onSurfaceVariant,
    fontSize: 10,
  },
  subtext: {
    ...TYPOGRAPHY.caption,
    fontWeight: '900',
    color: COLORS.primary,
    fontSize: 10,
  },
  button: {
    backgroundColor: COLORS.primary,
    height: 64,
    borderRadius: SIZES.radius + 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: COLORS.outlineVariant,
    opacity: 0.6,
  },
  buttonText: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
    color: COLORS.white,
  },
});
