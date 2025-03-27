import { ColorSchemeName } from 'react-native';

interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
}

const lightColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  primary: '#4CAF50',
  secondary: '#2196F3',
  text: '#000000',
  textSecondary: '#666666',
  border: '#E0E0E0',
  error: '#F44336',
};

const darkColors: ThemeColors = {
  background: '#121212',
  surface: '#1E1E1E',
  primary: '#81C784',
  secondary: '#64B5F6',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: '#333333',
  error: '#EF5350',
};

export const getThemeColors = (theme: ColorSchemeName): ThemeColors => {
  return theme === 'dark' ? darkColors : lightColors;
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  h3: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  body: {
    fontSize: 16,
  },
  caption: {
    fontSize: 12,
  },
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
}; 