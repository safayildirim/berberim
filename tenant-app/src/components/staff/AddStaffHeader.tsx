import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/src/constants/theme';
import { useTranslation } from 'react-i18next';

export const AddStaffHeader = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, height: 64 + insets.top },
      ]}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <ArrowLeft size={24} color={COLORS.primary} />
      </TouchableOpacity>
      <Text style={styles.title}>{t('settings.staff.addStaff')}</Text>
      <View style={styles.placeholder} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: COLORS.background,
    zIndex: 50,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: 'Manrope',
  },
  placeholder: {
    width: 40,
  },
});
