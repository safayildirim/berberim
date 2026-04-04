import { Info } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '@/src/constants/theme';
import { Appointment } from '@/src/types';

interface Props {
  appointment: Appointment;
}

export const AppointmentFinancialNotes: React.FC<Props> = ({ appointment }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.row}>
      {/* Notes Card */}
      <View style={styles.notesCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.label}>
            {t('appointmentDetail.internalNotes')}
          </Text>
          <TouchableOpacity
            onPress={() => Alert.alert('Edit', 'Note editing coming soon')}
          >
            <Text style={styles.editText}>{t('common.edit')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.notesBox}>
          <Text style={styles.notesText}>
            {appointment.notes_internal ||
              'No internal notes for this appointment.'}
          </Text>
        </View>
      </View>

      {/* Billing Card */}
      <View style={styles.billingCard}>
        <Text style={styles.label}>
          {t('appointmentDetail.billingSummary')}
        </Text>
        <View style={styles.billingRows}>
          <View style={styles.billingRow}>
            <Text style={styles.billingLabel}>
              {t('appointmentDetail.baseService')}
            </Text>
            <Text style={styles.billingValue}>
              ${parseFloat(appointment.total_price).toFixed(2)}
            </Text>
          </View>
          <View style={styles.billingDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              {t('appointmentDetail.totalAmount')}
            </Text>
            <Text style={styles.totalValue}>
              ${parseFloat(appointment.total_price).toFixed(2)}
            </Text>
          </View>
        </View>
        {appointment.status !== 'payment_received' &&
          appointment.status !== 'completed' && (
            <View style={styles.balanceDueBox}>
              <Info size={14} color="#93000b" />
              <Text style={styles.balanceDueText}>
                {t('appointmentDetail.balanceDue')}
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
    backgroundColor: '#f2f4f6',
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
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.secondary,
    letterSpacing: 1.5,
  },
  editText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  notesBox: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  notesText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#57657a',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  billingCard: {
    backgroundColor: '#f2f4f6',
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
  },
  billingLabel: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  billingValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  billingDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.primary,
  },
  balanceDueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 16,
  },
  balanceDueText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#93000b',
    letterSpacing: 0.5,
  },
});
