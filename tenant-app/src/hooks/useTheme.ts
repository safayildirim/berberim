import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/src/store/useThemeStore';
import { LIGHT_COLORS, DARK_COLORS } from '@/src/constants/theme';

export const useTheme = () => {
  const { themeMode, setThemeMode } = useThemeStore();
  const systemColorScheme = useColorScheme();

  const isDark =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
      : themeMode === 'dark';

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  const toggleTheme = () => {
    if (themeMode === 'light') setThemeMode('dark');
    else if (themeMode === 'dark') setThemeMode('system');
    else setThemeMode('light');
  };

  return {
    themeMode,
    setThemeMode,
    isDark,
    colors,
    toggleTheme,
  };
};
