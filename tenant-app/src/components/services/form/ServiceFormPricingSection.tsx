import { DollarSign, Star } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS } from '@/src/constants/theme';

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

  return (
    <View style={styles.section}>
      <View style={styles.sectionLabelRow}>
        <DollarSign size={14} color={COLORS.secondary} />
        <Text style={styles.sectionLabel}>
          {t('serviceForm.pricingLogistics')}
        </Text>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.gridCol}>
          <Text style={styles.inputLabel}>{t('serviceForm.basePrice')}</Text>
          <View style={styles.inputWithAdornment}>
            <Text style={styles.adornmentText}>$</Text>
            <TextInput
              style={styles.gridInput}
              placeholder="0.00"
              keyboardType="numeric"
              value={basePrice}
              onChangeText={(v) => onUpdate('basePrice', v)}
              placeholderTextColor="#c5c6cd"
            />
          </View>
        </View>

        <View style={styles.gridCol}>
          <Text style={styles.inputLabel}>{t('serviceForm.duration')}</Text>
          <View style={styles.inputWithAdornment}>
            <TextInput
              style={[styles.gridInput, { textAlign: 'right' }]}
              placeholder="45"
              keyboardType="numeric"
              value={durationMinutes}
              onChangeText={(v) => onUpdate('durationMinutes', v)}
              placeholderTextColor="#c5c6cd"
            />
            <Text style={styles.adornmentTextLabel}>
              {t('serviceCatalog.minutes')}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('serviceForm.loyaltyPoints')}</Text>
        <View style={styles.inputWithAdornment}>
          <Star
            size={14}
            color={COLORS.secondary}
            style={styles.adornmentIcon}
            fill={COLORS.secondary}
          />
          <TextInput
            style={styles.gridInput}
            placeholder="50"
            keyboardType="numeric"
            value={pointsReward}
            onChangeText={(v) => onUpdate('pointsReward', v)}
            placeholderTextColor="#c5c6cd"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#ffffff',
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
    color: COLORS.secondary,
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
    color: '#051125',
    paddingVertical: 14,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: 1,
    marginLeft: 4,
  },
  inputWithAdornment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eceef0',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(197, 198, 205, 0.15)',
  },
  adornmentText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#051125',
    marginRight: 4,
  },
  adornmentTextLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.secondary,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  adornmentIcon: {
    marginRight: 8,
  },
});
