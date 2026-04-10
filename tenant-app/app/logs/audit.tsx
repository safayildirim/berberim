import React from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import { Screen } from '@/src/components/common/Screen';
import { Header } from '@/src/components/common/Header';
import { COLORS, TYPOGRAPHY, SIZES, SHADOWS } from '@/src/constants/theme';
import { ShieldCheck, History, UserCircle2 } from 'lucide-react-native';

const MOCK_LOGS = [
  {
    id: '1',
    action: 'APPOINTMENT_COMPLETED',
    actor: 'Selim Akın',
    resource: 'Appt #124',
    time: '10:45 AM',
  },
  {
    id: '2',
    action: 'STAFF_SCHEDULE_UPDATED',
    actor: 'Okan Kurtsay (Admin)',
    resource: 'Weekly Rules',
    time: '09:30 AM',
  },
  {
    id: '3',
    action: 'SERVICE_PRICE_CHANGED',
    actor: 'Okan Kurtsay (Admin)',
    resource: 'Elite Fade',
    time: 'Yesterday',
  },
  {
    id: '4',
    action: 'CUSTOMER_CREATED',
    actor: 'Selim Akın',
    resource: 'Ahmet Yılmaz',
    time: 'Yesterday',
  },
  {
    id: '5',
    action: 'SYSTEM_SETTINGS_CHANGED',
    actor: 'Root (System)',
    resource: 'Loyalty Points',
    time: '2 days ago',
  },
];

export default function AuditLogsScreen() {
  const LogItem = ({ item }: any) => (
    <View style={[styles.card, SHADOWS.sm]}>
      <View style={styles.cardLeft}>
        <View style={styles.iconContainer}>
          <ShieldCheck size={20} color={COLORS.primary} strokeWidth={2.5} />
        </View>
      </View>
      <View style={styles.cardRight}>
        <View style={styles.row}>
          <Text style={styles.actionText}>{item.action}</Text>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
        <View style={styles.actorRow}>
          <UserCircle2 size={12} color={COLORS.primaryDim} />
          <Text style={styles.actorText}>{item.actor}</Text>
          <View style={styles.dot} />
          <History size={12} color={COLORS.primaryDim} />
          <Text style={styles.resourceText}>{item.resource}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <Screen style={styles.container} withPadding={false}>
      <Header showBack title="Audit Logs" />
      <View style={styles.headerRow}>
        <Text style={styles.label}>Activity History</Text>
      </View>
      <FlatList
        data={MOCK_LOGS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <LogItem item={item} />}
        contentContainerStyle={styles.listContainer}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.background },
  headerRow: { paddingHorizontal: SIZES.padding, paddingVertical: SIZES.md },
  label: {
    ...TYPOGRAPHY.caption,
    fontWeight: '900',
    color: COLORS.primaryDim,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  listContainer: { paddingHorizontal: SIZES.padding, paddingBottom: 100 },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHighest,
    alignItems: 'center',
  },
  cardLeft: { marginRight: SIZES.md },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardRight: { flex: 1 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionText: { ...TYPOGRAPHY.bodyBold, fontSize: 13, color: COLORS.text },
  timeText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    color: COLORS.primaryDim,
    fontWeight: '800',
  },
  actorRow: { flexDirection: 'row', alignItems: 'center' },
  actorText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.primaryDim,
    marginLeft: 4,
    fontWeight: '700',
  },
  resourceText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.primaryDim,
    marginLeft: 4,
    fontWeight: '700',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.border,
    marginHorizontal: 6,
  },
});
