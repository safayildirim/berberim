import React from 'react';
import { Image, StyleSheet, View, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, SIZES } from '@/src/constants/theme';
import { Typography } from '@/src/components/ui';
import { useTheme } from '@/src/store/useThemeStore';

interface ReviewHeaderProps {
  staffName?: string;
  staffImageUrl?: string;
}

export const ReviewHeader: React.FC<ReviewHeaderProps> = ({
  staffName = 'Julian',
  staffImageUrl,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.imageContainer,
          { borderColor: colors.surfaceContainerHigh },
        ]}
      >
        <Image
          source={{
            uri:
              staffImageUrl ||
              'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=300&h=300',
          }}
          style={styles.image}
        />
      </View>
      <Typography variant="h1" style={[styles.title, { color: colors.text }]}>
        {t('reviews.how_was_haircut')}
      </Typography>
      <Typography
        variant="body"
        style={[styles.subtitle, { color: colors.secondary }]}
      >
        {t('reviews.feedback_help', {
          name: staffName,
        })}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: SIZES.xl,
  },
  imageContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: SIZES.md,
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  image: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
