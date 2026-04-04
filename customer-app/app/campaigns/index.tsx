import { format, parseISO } from 'date-fns';
import { enUS, tr } from 'date-fns/locale';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Info, Tag } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import { Screen } from '@/src/components/common/Screen';
import { Button, Card, Typography } from '@/src/components/ui';
import { COLORS, SIZES } from '@/src/constants/theme';
import { useCampaignDetail } from '@/src/hooks/queries/useCampaigns';
import { useTenantStore } from '@/src/store/useTenantStore';

const { width } = Dimensions.get('window');

export default function CampaignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { getBranding } = useTenantStore();
  const { primaryColor } = getBranding();

  const {
    data: campaign,
    isLoading: isCampaignLoading,
    error,
  } = useCampaignDetail(id as string);

  const dateLocale = i18n.language.startsWith('tr') ? tr : enUS;

  if (!campaign && !isCampaignLoading) {
    return <Screen empty emptyTitle={t('campaigns.notFound')} />;
  }

  return (
    <Screen
      headerTitle={t('campaigns.specialOffer')}
      loading={isCampaignLoading}
      error={error}
      scrollable
      transparentStatusBar
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: campaign?.imageUrl }} style={styles.image} />
        <View style={styles.overlay} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleCard}>
          <Typography variant="h1">{campaign?.title}</Typography>
          <View style={styles.badgeRow}>
            <View
              style={[styles.badge, { backgroundColor: primaryColor + '15' }]}
            >
              <Tag size={14} color={primaryColor} />
              <Typography
                variant="caption"
                color={primaryColor}
                style={styles.badgeText}
              >
                {t('campaigns.limitedOffer')}
              </Typography>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Typography variant="h3" style={styles.sectionTitle}>
            {t('campaigns.details')}
          </Typography>
          <Typography
            variant="body"
            color={COLORS.secondary}
            style={styles.description}
          >
            {campaign?.description}
          </Typography>
        </View>

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Calendar size={20} color={primaryColor} />
            <View style={styles.infoText}>
              <Typography variant="label">{t('campaigns.validity')}</Typography>
              <Typography variant="body" color={COLORS.secondary}>
                {campaign
                  ? `${format(parseISO(campaign.startDate), 'MMM d', { locale: dateLocale })} - ${format(parseISO(campaign.endDate), 'MMM d, yyyy', { locale: dateLocale })}`
                  : ''}
              </Typography>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Info size={20} color={primaryColor} />
            <View style={styles.infoText}>
              <Typography variant="label">{t('campaigns.terms')}</Typography>
              <Typography variant="caption" color={COLORS.secondary}>
                {t('campaigns.termsContent')}
              </Typography>
            </View>
          </View>
        </Card>

        <View style={styles.actionContainer}>
          <Button
            title={t('campaigns.bookWithOffer')}
            onPress={() => router.push('/booking/services')}
            size="lg"
            style={styles.bookButton}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    width: width,
    height: width * 0.75,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  content: {
    flex: 1,
    padding: SIZES.padding,
    backgroundColor: COLORS.background,
    marginTop: -32,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  titleCard: {
    marginBottom: SIZES.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: SIZES.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    fontWeight: '800',
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: SIZES.xl,
  },
  sectionTitle: {
    marginBottom: SIZES.sm,
  },
  description: {
    lineHeight: 24,
  },
  infoCard: {
    padding: SIZES.md,
    marginBottom: SIZES.xl,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    marginLeft: SIZES.md,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SIZES.md,
  },
  actionContainer: {
    paddingVertical: SIZES.lg,
    marginBottom: SIZES.xl,
  },
  bookButton: {
    width: '100%',
  },
});
