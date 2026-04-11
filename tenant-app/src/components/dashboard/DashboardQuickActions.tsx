import { useRouter } from 'expo-router';
import { Calendar, Plus, Settings, Users } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SHADOWS, TYPOGRAPHY } from '@/src/constants/theme';
import { useTheme } from '@/src/hooks/useTheme';

interface Props {
  isAdmin: boolean;
}

const QuickAction = ({
  title,
  sub,
  icon: Icon,
  onPress,
  colors,
  variant = 'default',
}: any) => {
  const isTertiary = variant === 'tertiary';
  const accentColor = isTertiary ? colors.secondary : colors.primary;

  return (
    <TouchableOpacity
      style={[
        styles.actionButton,
        { backgroundColor: colors.card, borderColor: colors.border + '15' },
        isTertiary && {
          backgroundColor: colors.surfaceContainerLow,
        },
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.actionIconContainer,
          {
            backgroundColor: accentColor + '15',
          },
        ]}
      >
        <Icon size={20} color={accentColor} />
      </View>
      <View>
        <Text style={[styles.actionTitle, { color: colors.primary }]}>
          {title}
        </Text>
        <Text style={[styles.actionSub, { color: colors.secondary }]}>
          {sub}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export const DashboardQuickActions: React.FC<Props> = ({ isAdmin }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>
        {t('dashboard.quickActions.title')}
      </Text>
      <View style={styles.actionsGrid}>
        <QuickAction
          title={t('dashboard.quickActions.calendar.title')}
          sub={t('dashboard.quickActions.calendar.sub')}
          icon={Calendar}
          colors={colors}
          onPress={() => router.push('/(tabs)/calendar')}
        />
        <QuickAction
          title={t('dashboard.quickActions.add.title')}
          sub={t('dashboard.quickActions.add.sub')}
          icon={Plus}
          colors={colors}
          onPress={() => router.push('/appointments/create')}
        />
        <QuickAction
          title={t('dashboard.quickActions.customers.title')}
          sub={t('dashboard.quickActions.customers.sub')}
          icon={Users}
          colors={colors}
          onPress={() => router.push('/(tabs)/customers')}
        />
        {isAdmin && (
          <QuickAction
            title={t('dashboard.quickActions.services.title')}
            sub={t('dashboard.quickActions.services.sub')}
            icon={Settings}
            colors={colors}
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
    ...TYPOGRAPHY.h3,
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
    padding: 20,
    margin: '1%',
    borderRadius: 24,
    gap: 12,
    ...SHADOWS.sm,
    borderWidth: 1,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    ...TYPOGRAPHY.bodyBold,
    fontSize: 14,
    marginBottom: 2,
  },
  actionSub: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: '500',
  },
});
