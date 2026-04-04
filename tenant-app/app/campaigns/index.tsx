import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Screen } from '../../src/components/common/Screen';
import { Header } from '../../src/components/common/Header';
import { COLORS, TYPOGRAPHY, SIZES, SHADOWS } from '../../src/constants/theme';
import {
  Megaphone,
  Plus,
  ChevronRight,
  Share2,
  Bell,
} from 'lucide-react-native';
import { Badge } from '../../src/components/common/Badge';

const MOCK_CAMPAIGNS = [
  {
    id: '1',
    title: 'Ramadan Special Fade',
    desc: '15% off for all fade services',
    status: 'active',
    reach: 120,
    type: 'discount',
  },
  {
    id: '2',
    title: 'Loyalty Boost Week',
    desc: 'Double points for V.I.P packages',
    status: 'active',
    reach: 450,
    type: 'loyalty',
  },
  {
    id: '3',
    title: 'Welcome Back Promo',
    desc: 'Special discount for returning customers',
    status: 'paused',
    reach: 89,
    type: 'general',
  },
];

export default function CampaignsScreen() {
  const CampaignCard = ({ item }: any) => (
    <View style={[styles.card, SHADOWS.sm]}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Megaphone size={22} color={COLORS.primary} strokeWidth={2.5} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Badge
            label={item.status}
            status={item.status === 'active' ? 'success' : 'no_show'}
          />
        </View>
      </View>
      <Text style={styles.cardDesc}>{item.desc}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.reachInfo}>
          <Bell size={14} color={COLORS.primaryDim} />
          <Text style={styles.reachText}>Reach: {item.reach} customers</Text>
        </View>
        <TouchableOpacity style={styles.manageBtn}>
          <Text style={styles.manageBtnText}>Edit</Text>
          <ChevronRight size={14} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Screen style={styles.container} withPadding={false}>
      <Header title="Campaigns" />
      <View style={styles.headerRow}>
        <Text style={styles.label}>Marketing Promotions</Text>
        <TouchableOpacity style={styles.addButton}>
          <Plus size={18} color={COLORS.white} strokeWidth={2.5} />
          <Text style={styles.addButtonText}>New Promo</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={MOCK_CAMPAIGNS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CampaignCard item={item} />}
        contentContainerStyle={styles.listContainer}
      />
      <View style={styles.bottomLinkContainer}>
        <TouchableOpacity style={styles.promoBtn}>
          <Share2 size={20} color={COLORS.white} />
          <Text style={styles.promoBtnText}>Send Push Notification</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.background },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.md,
  },
  label: {
    ...TYPOGRAPHY.caption,
    fontWeight: '900',
    color: COLORS.primaryDim,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '800',
    marginLeft: 4,
  },
  listContainer: { paddingHorizontal: SIZES.padding, paddingBottom: 120 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHighest,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: { ...TYPOGRAPHY.bodyBold, fontSize: 15, flex: 1, marginRight: 10 },
  cardDesc: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    color: COLORS.primaryDim,
    marginBottom: SIZES.md,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SIZES.sm,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.surfaceContainerHighest,
  },
  reachInfo: { flexDirection: 'row', alignItems: 'center' },
  reachText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primaryDim,
    marginLeft: 6,
    fontWeight: '700',
  },
  manageBtn: { flexDirection: 'row', alignItems: 'center' },
  manageBtnText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '900',
    color: COLORS.primary,
    marginRight: 4,
  },
  bottomLinkContainer: {
    position: 'absolute',
    bottom: SIZES.padding,
    left: SIZES.padding,
    right: SIZES.padding,
  },
  promoBtn: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: SIZES.radius,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoBtnText: { ...TYPOGRAPHY.bodyBold, color: COLORS.white, marginLeft: 10 },
});
