import { Info } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TYPOGRAPHY } from '@/src/constants/theme';
import { Appointment } from '@/src/types';
import { useTheme } from '@/src/hooks/useTheme';

interface Props {
  appointment: Appointment;
}

export const AppointmentFinancialNotes: React.FC<Props> = ({ appointment }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      {/* Notes Card */}
      <View
        style={[
          styles.notesCard,
          { backgroundColor: colors.surfaceContainerLow },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.label, { color: colors.secondary }]}>
            {t('appointmentDetail.internalNotes').toUpperCase()}
          </Text>
          <TouchableOpacity
            onPress={() => Alert.alert('Edit', t('common.comingSoon'))}
          >
            <Text style={[styles.editText, { color: colors.primary }]}>
              {t('common.edit')}
            </Text>
          </TouchableOpacity>
        </View>
        <View
          style={[
            styles.notesBox,
            { backgroundColor: colors.card, borderColor: colors.border + '15' },
          ]}
        >
          <Text style={[styles.notesText, { color: colors.secondary }]}>
            {appointment.notes_internal ||
              t('appointmentDetail.messages.noNotes')}
          </Text>
        </View>
      </View>

      {/* Billing Card */}
      <View
        style={[
          styles.billingCard,
          { backgroundColor: colors.surfaceContainerLow },
        ]}
      >
        <Text style={[styles.label, { color: colors.secondary }]}>
          {t('appointmentDetail.billingSummary').toUpperCase()}
        </Text>
        <View style={styles.billingRows}>
          <View style={styles.billingRow}>
            <Text style={[styles.billingLabel, { color: colors.secondary }]}>
              {t('appointmentDetail.baseService')}
            </Text>
            <Text style={[styles.billingValue, { color: colors.primary }]}>
              {parseFloat(appointment.total_price).toFixed(2)} ₺
            </Text>
          </View>
          <View
            style={[
              styles.billingDivider,
              { backgroundColor: colors.border + '10' },
            ]}
          />
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.primary }]}>
              {t('appointmentDetail.totalAmount')}
            </Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              {parseFloat(appointment.total_price).toFixed(2)} ₺
            </Text>
          </View>
        </View>
        {appointment.status !== 'payment_received' &&
          appointment.status !== 'completed' && (
            <View
              style={[
                styles.balanceDueBox,
                { backgroundColor: colors.error + '15' },
              ]}
            >
              <Info size={14} color={colors.error} />
              <Text style={[styles.balanceDueText, { color: colors.error }]}>
                {t('appointmentDetail.balanceDue').toUpperCase()}
              </Text>
            </View>
          )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'column',
    gap: 16,
    marginTop: 16,
  },
  notesCard: {
    borderRadius: 24,
    padding: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    ...TYPOGRAPHY.label,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  editText: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 12,
  },
  notesBox: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  notesText: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  billingCard: {
    borderRadius: 24,
    padding: 24,
  },
  billingRows: {
    gap: 12,
    marginTop: 16,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billingLabel: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
  },
  billingValue: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 14,
  },
  billingDivider: {
    height: 1,
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  totalLabel: {
    ...TYPOGRAPHY.label,
    fontSize: 12,
    fontWeight: '900',
  },
  totalValue: {
    ...TYPOGRAPHY.h2,
    fontSize: 28,
  },
  balanceDueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  balanceDueText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
