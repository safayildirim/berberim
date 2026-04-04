import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, TYPOGRAPHY, SIZES, SHADOWS } from '@/src/constants/theme';
import { Staff } from '@/src/types';

interface Props {
  selectedStaff: Staff | null;
  allStaff: Staff[];
}

export const ProfessionalStatsHUD = ({ selectedStaff, allStaff }: Props) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.avatarStack}>
        {allStaff.slice(0, 3).map((s, index) => (
          <View
            key={s.id}
            style={[
              styles.avatarFrame,
              { zIndex: 10 - index, marginLeft: index === 0 ? 0 : -SIZES.md },
            ]}
          >
            {s.avatar_url ? (
              <Image source={{ uri: s.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {s.first_name[0]}
                  {s.last_name[0]}
                </Text>
              </View>
            )}
          </View>
        ))}
        {allStaff.length > 3 && (
          <View style={styles.moreBadge}>
            <Text style={styles.moreText}>+{allStaff.length - 3}</Text>
          </View>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>
            {t('appointmentCreate.capacity')}
          </Text>
          <Text style={styles.statValue}>
            {t('appointmentCreate.capacityValue', { value: 85 })}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>
            {t('appointmentCreate.avgSession')}
          </Text>
          <Text style={styles.statValue}>
            {t('appointmentCreate.avgSessionValue', { minutes: 45 })}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: SIZES.xl,
    padding: SIZES.md,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: SIZES.radius + 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarFrame: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.white,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceContainerHighest,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.onSurfaceVariant,
  },
  moreBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryContainer,
    borderWidth: 2,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -SIZES.md,
    zIndex: 0,
  },
  moreText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md,
  },
  stat: {
    alignItems: 'flex-end',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.secondary,
    textTransform: 'uppercase',
    letterSpacing: -0.2,
  },
  statValue: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 13,
    color: COLORS.primary,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
});
