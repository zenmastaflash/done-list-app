import { ColorSchemeName, StyleSheet } from 'react-native';

export interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
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
  background: '#FFFFFF',
  surface: '#F5F5F5',
  primary: '#4CAF50',
  secondary: '#2196F3',
  text: '#000000',
  textSecondary: '#666666',
  border: '#E0E0E0',
  error: '#F44336',
  success: '#4CAF50',
  warning: '#FFC107',
  switchTrack: {
    false: '#767577',
    true: '#4CAF50'
  },
  switchThumb: {
    false: '#f4f3f4',
    true: '#f5dd4b'
  }
};

export const darkColors: ThemeColors = {
  background: '#121212',
  surface: '#1E1E1E',
  primary: '#81C784',
  secondary: '#64B5F6',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: '#333333',
  error: '#EF5350',
  success: '#81C784',
  warning: '#FFD54F',
  switchTrack: {
    false: '#767577',
    true: '#81C784'
  },
  switchThumb: {
    false: '#f4f3f4',
    true: '#f5dd4b'
  }
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