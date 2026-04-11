import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Check, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { TYPOGRAPHY, SIZES, SHADOWS } from '@/src/constants/theme';
import { Customer } from '@/src/types';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useTheme } from '@/src/hooks/useTheme';

interface Props {
  customer: Customer;
  isSelected: boolean;
  onSelect: (customer: Customer) => void;
}

export const CustomerCard = ({ customer, isSelected, onSelect }: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const lastVisitText = customer.last_appointment_at
    ? formatDistanceToNow(parseISO(customer.last_appointment_at))
    : null;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          borderColor: isSelected ? colors.primary : 'transparent',
          backgroundColor: colors.surfaceContainerLowest,
        },
        !isSelected && SHADOWS.sm,
      ]}
      onPress={() => onSelect(customer)}
      activeOpacity={0.8}
    >
      <View style={styles.topRow}>
        <View style={styles.leftContent}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: isSelected
                  ? colors.primary + '20'
                  : colors.surfaceContainerHigh,
              },
            ]}
          >
            {customer.last_name === 'AvatarImagePlaceholder' ? (
              <Image
                source={{
                  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDt0i6Iav09a9wp2gV4sGlVLc6yzW_O6AGdh1TjAzBc1tdEUDk93HtJrck5RTFExsDlop2BtcNUQ3GW1c2eAHsijbnn0m_gR6t6sd761GQ_khlWyJpIMBJtsl2PhnzVSiC9qW5n3LfvbHh_eCkPc_qwrBqAEEv_H7yw6wqt6J2oxZ6XtV_N545jqI5SJ3I4fYSMsv0yJ2alZo1IUwUCMQt3YPokOZajwxRgrV46u15QMN4iGZQ_D-E-rp42hI9SEir0LxbFmSFxwYqq',
                }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {customer.first_name[0]}
                {customer.last_name[0]}
              </Text>
            )}
          </View>
          <View>
            <Text style={[styles.name, { color: colors.primary }]}>
              {customer.first_name} {customer.last_name}
            </Text>
            <Text style={[styles.phone, { color: colors.secondary }]}>
              {customer.phone_number}
            </Text>
          </View>
        </View>

        {isSelected ? (
          <View
            style={[styles.checkBadge, { backgroundColor: colors.primary }]}
          >
            <Check size={18} color={colors.onPrimary} strokeWidth={3} />
          </View>
        ) : (
          <ChevronRight size={20} color={colors.outline} />
        )}
      </View>

      {isSelected && (
        <View
          style={[styles.tagSection, { borderTopColor: colors.border + '15' }]}
        >
          {lastVisitText && (
            <View
              style={[
                styles.tag,
                { backgroundColor: colors.surfaceContainerHigh },
              ]}
            >
              <Text style={[styles.tagText, { color: colors.primary }]}>
                {t('appointmentCreate.lastVisitByTime', {
                  time: lastVisitText,
                })}
              </Text>
            </View>
          )}
          {customer.visit_count > 5 && (
            <View
              style={[
                styles.tag,
                { backgroundColor: colors.surfaceContainerHigh },
              ]}
            >
              <Text style={[styles.tagText, { color: colors.primary }]}>
                {t('appointmentCreate.vipClient')}
              </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SIZES.md + 4,
    borderRadius: SIZES.radius + 12,
    marginBottom: SIZES.md,
    borderWidth: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 16,
  },
  name: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
  },
  phone: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    marginTop: 2,
  },
  checkBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagSection: {
    marginTop: SIZES.md,
    paddingTop: SIZES.sm,
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
  },
  tag: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.xs + 2,
  },
  tagText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});
