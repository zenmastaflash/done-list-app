import { ColorSchemeName, StyleSheet } from 'react-native';

export interface ThemeColors {
  primary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  secondary: string;
  accent: string;
  muted: string;
  highlight: string;
  card: string;
  switchTrack: {
    false: string;
    true: string;
  };
  switchThumb: {
    false: string;
    true: string;
  };
}

export const lightColors: ThemeColors = {
  primary: '#7C9E8F',
  background: '#F5F7F5',
  surface: '#FFFFFF',
  text: '#2C3E50',
  textSecondary: '#7C9E8F',
  border: '#E8EDE9',
  error: '#E8A5A5',
  success: '#7C9E8F',
  warning: '#F4D03F',
  info: '#7C9E8F',
  secondary: '#A8C0B5',
  accent: '#D4E2D4',
  muted: '#B8C4BE',
  highlight: '#E8EDE9',
  card: '#FFFFFF',
  switchTrack: {
    false: '#767577',
    true: '#7C9E8F',
  },
  switchThumb: {
    false: '#f4f3f4',
    true: '#f5dd4b',
  },
};

export const darkColors: ThemeColors = {
  primary: '#7C9EFF',
  secondary: '#FFB5B5',
  background: '#1A1B1E',
  surface: '#2C2D30',
  card: '#2C2D30',
  text: '#E8EDE9',
  textSecondary: '#A0A5A1',
  border: '#3A3B3E',
  error: '#FF6B6B',
  success: '#4CAF50',
  warning: '#FFB74D',
  highlight: '#7C9EFF',
  muted: '#6B7280',
  info: '#7C9EFF',
  accent: '#FFB5B5',
  switchTrack: {
    true: '#4A4B4E',
    false: '#3A3B3E'
  },
  switchThumb: {
    true: '#7C9EFF',
    false: '#6B7280'
  }
};

export const getThemeColors = (isDark: boolean): ThemeColors => {
  return isDark ? darkColors : lightColors;
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
    fontWeight: 'bold' as const,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
  },
  h3: {
    fontSize: 20,
    fontWeight: 'bold' as const,
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

// Common styles that can be reused across the app
export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  input: {
    borderWidth: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    fontSize: 16,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
}); 