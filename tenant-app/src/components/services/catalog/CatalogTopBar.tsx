import { useRouter } from 'expo-router';
import { ArrowLeft, Search } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '@/src/constants/theme';

export const CatalogTopBar: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.topBar}>
      <View style={styles.topBarLeft}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>{t('serviceCatalog.title')}</Text>
      </View>
      <TouchableOpacity style={styles.iconBtn}>
        <Search size={24} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  iconBtn: {
    padding: 8,
  },
});
