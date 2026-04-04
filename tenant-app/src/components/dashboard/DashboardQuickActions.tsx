import { useRouter } from 'expo-router';
import { Calendar, Plus, Settings, Users } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SHADOWS } from '@/src/constants/theme';

interface Props {
  isAdmin: boolean;
}

const QuickAction = ({
  title,
  sub,
  icon: Icon,
  onPress,
  variant = 'default',
}: any) => {
  const isTertiary = variant === 'tertiary';
  return (
    <TouchableOpacity
      style={[
        styles.actionButton,
        isTertiary && { backgroundColor: '#f0f4f8' },
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.actionIconContainer,
          {
            backgroundColor: isTertiary ? COLORS.secondary : COLORS.primary,
          },
        ]}
      >
        <Icon size={20} color={COLORS.white} />
      </View>
      <View>
        <Text
          style={[styles.actionTitle, isTertiary && { color: COLORS.primary }]}
        >
          {title}
        </Text>
        <Text
          style={[styles.actionSub, isTertiary && { color: COLORS.secondary }]}
        >
          {sub}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export const DashboardQuickActions: React.FC<Props> = ({ isAdmin }) => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {t('dashboard.quickActions.title')}
      </Text>
      <View style={styles.actionsGrid}>
        <QuickAction
          title={t('dashboard.quickActions.calendar.title')}
          sub={t('dashboard.quickActions.calendar.sub')}
          icon={Calendar}
          onPress={() => router.push('/(tabs)/calendar')}
        />
        <QuickAction
          title={t('dashboard.quickActions.add.title')}
          sub={t('dashboard.quickActions.add.sub')}
          icon={Plus}
          onPress={() => router.push('/appointments/create')}
        />
        <QuickAction
          title={t('dashboard.quickActions.customers.title')}
          sub={t('dashboard.quickActions.customers.sub')}
          icon={Users}
          onPress={() => router.push('/(tabs)/customers')}
        />
        {isAdmin && (
          <QuickAction
            title={t('dashboard.quickActions.services.title')}
            sub={t('dashboard.quickActions.services.sub')}
            icon={Settings}
            variant="tertiary"
            onPress={() => router.push('/services')}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  actionButton: {
    width: '48%',
    backgroundColor: COLORS.white,
    padding: 20,
    margin: '1%',
    borderRadius: 24,
    gap: 12,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 2,
  },
  actionSub: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.secondary,
  },
});
