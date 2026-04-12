import { Bell } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';

interface Props {
  shopName: string;
  logoUrl?: string;
}

export const DashboardTopBar: React.FC<Props> = ({ shopName, logoUrl }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.topBar,
        {
          backgroundColor: colors.background + 'CC',
          borderBottomColor: colors.border + '15',
        },
      ]}
    >
      <View style={styles.shopBranding}>
        <View
          style={[
            styles.logoContainer,
            { backgroundColor: colors.primaryContainer },
          ]}
        >
          <Image
            source={{
              uri:
                logoUrl ||
                'https://lh3.googleusercontent.com/aida-public/AB6AXuCdXrpZFvjk6N8Vpazb81Q92xw2_6jbF-XtSKvT-HPGgHRvYe64AuAgFiA9m5J0yeg5zW_2s7guKqMVsYcuOuH_cbrO2vWXYaRV5yG5LOeuhJFc0A_370ALDA3rOf1xl6Gat-Tahsf6IJfvaIMn2CPS1XTilJoNay8bcS8-aOdXXASJO-NibFof2OZ4wzHlD_G4BTIG5KiyBg1DeeKp3eaoloUOBZZvExRmzEvyJ2WPdDG57uDO497hnUNAQZCkKDgyziL6bjSL3M7u',
            }}
            style={styles.logo}
          />
        </View>
        <Text style={[styles.shopName, { color: colors.primary }]}>
          {shopName}
        </Text>
      </View>
      <TouchableOpacity style={styles.iconButton}>
        <Bell size={24} color={colors.primary} />
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
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  shopBranding: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 10,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  shopName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  iconButton: {
    padding: 8,
  },
});
