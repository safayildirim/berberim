import { ArrowRight, Coffee, Smile } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { COLORS } from '@/src/constants/theme';
import { useTenantStore } from '@/src/store/useTenantStore';
import { Reward } from '@/src/types';
import { Button, Typography } from '@/src/components/ui';

interface LoyaltyRewardCardProps {
  reward: Reward;
  variant?: 'large' | 'small' | 'horizontal';
  onPress?: () => void;
  style?: ViewStyle;
}

const RewardIcon = ({ title, color }: { title: string; color: string }) => {
  if (
    title.toLowerCase().includes('coffee') ||
    title.toLowerCase().includes('espresso')
  ) {
    return <Coffee size={24} color={color} pointerEvents="none" />;
  }
  if (
    title.toLowerCase().includes('towel') ||
    title.toLowerCase().includes('face')
  ) {
    return <Smile size={24} color={color} pointerEvents="none" />;
  }
  return null;
};

export const LoyaltyRewardCard: React.FC<LoyaltyRewardCardProps> = ({
  reward,
  variant = 'small',
  onPress,
  style,
}) => {
  const { t } = useTranslation();
  const { getBranding } = useTenantStore();
  const { primaryColor } = getBranding();

  if (variant === 'large') {
    return (
      <View style={[styles.largeCard, style]}>
        <View style={styles.largeCardContent}>
          <View style={styles.largeImageContainer}>
            <Image
              source={{
                uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBV0OKhu7svlNnokNToB3YQVodJrB-XGD1N6HaCfS2mpODlJOcNgOBmL-inqV5FYlb4lxVpHhyA5K_T0tmIFlwhL8ZawZ97rt3CHyrMQjbQXOfNK97Y0K6fKzllz3qIrqJ_mu7orl8QaNk3DfST0r6NUrstPY_i9qVwi1i1uLITppPi5Pvgca12N6CqhW7BnossBn6XAZ2XUVnI1KpTwLgprisEH1x7wj2KESJi7fGIplayRElZrLdYHqMCtbXjcHQPe2kBpANJy6b8',
              }}
              style={styles.largeImage}
            />
          </View>
          <View style={styles.largeBody}>
            <View style={styles.largeHeader}>
              <View style={{ flex: 1 }}>
                <Typography variant="h3" style={styles.largeTitle}>
                  {reward.title}
                </Typography>
                <Typography
                  variant="body"
                  color={COLORS.secondary}
                  style={styles.largeDesc}
                >
                  {reward.description}
                </Typography>
              </View>
              <View
                style={[
                  styles.pointsBadge,
                  { backgroundColor: primaryColor + '15' },
                ]}
              >
                <Typography
                  variant="label"
                  color={primaryColor}
                  style={{ fontWeight: '800' }}
                >
                  {reward.pointsCost} PTS
                </Typography>
              </View>
            </View>
            <Button
              title={t('loyalty.redeemNow').toUpperCase()}
              onPress={onPress || (() => {})}
              variant="primary"
              titleStyle={styles.largeBtnText}
              style={styles.largeBtn}
            />
          </View>
        </View>
      </View>
    );
  }

  if (variant === 'horizontal') {
    return (
      <View style={[styles.horizontalCard, style]}>
        <View style={styles.horizontalImageContainer}>
          <Image
            source={{
              uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBE_adS_4DLEfsRvJ-NWxstHzoYa5b68NbWLg9MkWDoNUF-RyzdNKmNk9n-IgPNMfgp82_FTqyX3A-Q59v73JsrY7yxI7UwG6_YygoncQKxgE7NlvBgFlEDRDKlf052ok2kGcNZCEsDpdWT2VZXmmggeKFDcvRGL9eHR6Uyg7AKzS6CiIDbE2s58hEf4ut9wT5yhvirklBlMuVKMnPXJidZ4h47vonveestIDbKzJ-rOWrKaRXUEAMm47T9X_BbeORSA5eGefM0LE0t',
            }}
            style={styles.horizontalImage}
          />
        </View>
        <View style={styles.horizontalBody}>
          <Typography variant="h3" style={styles.horizontalTitle}>
            {reward.title}
          </Typography>
          <Typography
            variant="body"
            color={COLORS.secondary}
            style={styles.horizontalDesc}
          >
            {reward.description}
          </Typography>
          <View style={styles.horizontalFooter}>
            <Typography
              variant="h3"
              style={styles.pointsLabel}
              color={primaryColor}
            >
              {reward.pointsCost} PTS
            </Typography>
            <TouchableOpacity onPress={onPress}>
              <View style={styles.selectButton}>
                <Typography variant="label" style={styles.selectBtnText}>
                  {t('loyalty.select').toUpperCase()}
                </Typography>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.smallCard, style]}
    >
      <View style={styles.iconBox}>
        <RewardIcon title={reward.title} color={primaryColor} />
      </View>
      <View>
        <Typography variant="h3" style={styles.smallTitle}>
          {reward.title}
        </Typography>
        <Typography
          variant="body"
          color={COLORS.secondary}
          style={styles.smallDesc}
        >
          {reward.description}
        </Typography>
      </View>
      <View style={styles.smallFooter}>
        <Typography
          variant="h3"
          color={primaryColor}
          style={styles.pointsLabel}
        >
          {reward.pointsCost} PTS
        </Typography>
        <ArrowRight size={20} color={COLORS.secondary} pointerEvents="none" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  largeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 4,
    shadowColor: '#2a3439',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 4,
  },
  largeCardContent: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    overflow: 'hidden',
  },
  largeImageContainer: {
    height: 220,
    width: '100%',
  },
  largeImage: {
    width: '100%',
    height: '100%',
  },
  largeBody: {
    padding: 32,
  },
  largeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 16,
  },
  largeTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  largeDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  largeBtn: {
    height: 56,
    borderRadius: 12,
  },
  largeBtnText: {
    letterSpacing: 2,
    fontWeight: '700',
  },
  pointsBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
  },
  smallCard: {
    backgroundColor: '#f1edec',
    borderRadius: 32,
    padding: 32,
    flex: 1,
    minHeight: 240,
    justifyContent: 'space-between',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  smallTitle: {
    fontSize: 18,
    color: '#1c1b1b',
    fontWeight: '700',
    marginBottom: 8,
  },
  smallDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  smallFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 32,
  },
  pointsLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  horizontalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 24,
    flexDirection: 'row',
    gap: 24,
    shadowColor: '#2a3439',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.04,
    shadowRadius: 32,
    elevation: 2,
  },
  horizontalImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
  },
  horizontalImage: {
    width: '100%',
    height: '100%',
  },
  horizontalBody: {
    flex: 1,
    justifyContent: 'center',
  },
  horizontalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  horizontalDesc: {
    fontSize: 14,
    marginBottom: 16,
  },
  horizontalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  selectButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: '#e5e2e1',
  },
  selectBtnText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
});
