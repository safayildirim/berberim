import { DollarSign, Star } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';

interface Props {
  basePrice: string;
  durationMinutes: string;
  pointsReward: string;
  onUpdate: (field: any, value: any) => void;
}

export const ServiceFormPricingSection: React.FC<Props> = ({
  basePrice,
  durationMinutes,
  pointsReward,
  onUpdate,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View
      style={[styles.section, { backgroundColor: colors.surfaceContainerLow }]}
    >
      <View style={styles.sectionLabelRow}>
        <DollarSign size={14} color={colors.secondary} />
        <Text style={[styles.sectionLabel, { color: colors.secondary }]}>
          {t('serviceForm.pricingLogistics')}
        </Text>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.gridCol}>
          <Text style={[styles.inputLabel, { color: colors.secondary }]}>
            {t('serviceForm.basePrice')}
          </Text>
          <View
            style={[
              styles.inputWithAdornment,
              { backgroundColor: colors.surfaceContainerHigh },
            ]}
          >
            <Text style={[styles.adornmentText, { color: colors.primary }]}>
              $
            </Text>
            <TextInput
              style={[styles.gridInput, { color: colors.primary }]}
              placeholder="0.00"
              keyboardType="numeric"
              value={basePrice}
              onChangeText={(v) => onUpdate('basePrice', v)}
              placeholderTextColor={colors.outline + '80'}
              selectionColor={colors.primary}
            />
          </View>
        </View>

        <View style={styles.gridCol}>
          <Text style={[styles.inputLabel, { color: colors.secondary }]}>
            {t('serviceForm.duration')}
          </Text>
          <View
            style={[
              styles.inputWithAdornment,
              { backgroundColor: colors.surfaceContainerHigh },
            ]}
          >
            <TextInput
              style={[
                styles.gridInput,
                { textAlign: 'right', color: colors.primary },
              ]}
              placeholder="45"
              keyboardType="numeric"
              value={durationMinutes}
              onChangeText={(v) => onUpdate('durationMinutes', v)}
              placeholderTextColor={colors.outline + '80'}
              selectionColor={colors.primary}
            />
            <Text
              style={[styles.adornmentTextLabel, { color: colors.secondary }]}
            >
              {t('serviceCatalog.minutes')}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: colors.secondary }]}>
          {t('serviceForm.loyaltyPoints')}
        </Text>
        <View
          style={[
            styles.inputWithAdornment,
            { backgroundColor: colors.surfaceContainerHigh },
          ]}
        >
          <Star
            size={14}
            color={colors.secondary}
            style={styles.adornmentIcon}
            fill={colors.secondary}
          />
          <TextInput
            style={[styles.gridInput, { color: colors.primary }]}
            placeholder="50"
            keyboardType="numeric"
            value={pointsReward}
            onChangeText={(v) => onUpdate('pointsReward', v)}
            placeholderTextColor={colors.outline + '80'}
            selectionColor={colors.primary}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
    gap: 20,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: -5,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 16,
  },
  gridCol: {
    flex: 1,
    gap: 8,
  },
  gridInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 14,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginLeft: 4,
  },
  inputWithAdornment: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(197, 198, 205, 0.15)',
  },
  adornmentText: {
    fontSize: 14,
    fontWeight: '700',
    marginRight: 4,
  },
  adornmentTextLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  adornmentIcon: {
    marginRight: 8,
  },
});
