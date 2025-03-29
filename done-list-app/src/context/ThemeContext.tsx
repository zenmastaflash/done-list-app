import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { supabase } from '../lib/supabase';
import { ThemeColors, getThemeColors } from '../styles/globals';

type Theme = {
  isDark: boolean;
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
    success: string;
    error: string;
    warning: string;
    info: string;
    secondary: string;
    accent: string;
    muted: string;
    highlight: string;
  };
};

const lightTheme: Theme = {
  isDark: false,
  colors: {
    primary: '#7C9E8F', // Soothing sage green
    background: '#F5F7F5', // Light gray-green
    card: '#FFFFFF',
    text: '#2C3E50', // Dark blue-gray
    border: '#E8EDE9', // Light sage
    notification: '#7C9E8F', // Matching primary
    success: '#7C9E8F', // Soothing green
    error: '#E8A5A5', // Soft red
    warning: '#F4D03F', // Warm yellow
    info: '#7C9E8F', // Matching primary
    secondary: '#A8C0B5', // Lighter sage
    accent: '#D4E2D4', // Very light sage
    muted: '#B8C4BE', // Muted sage
    highlight: '#E8EDE9', // Light sage
  },
};

const darkTheme: Theme = {
  isDark: true,
  colors: {
    primary: '#7C9E8F', // Soothing sage green
    background: '#1A1F1C', // Dark gray-green
    card: '#2C3E2F', // Darker sage
    text: '#E8EDE9', // Light sage
    border: '#3C4A3F', // Dark sage
    notification: '#7C9E8F', // Matching primary
    success: '#7C9E8F', // Soothing green
    error: '#E8A5A5', // Soft red
    warning: '#F4D03F', // Warm yellow
    info: '#7C9E8F', // Matching primary
    secondary: '#A8C0B5', // Lighter sage
    accent: '#3C4A3F', // Dark sage
    muted: '#4A5A4F', // Muted dark sage
    highlight: '#3C4A3F', // Dark sage
  },
};

interface ThemeContextType {
  theme: 'light' | 'dark';
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<'light' | 'dark'>(systemColorScheme || 'light');

  const colors = getThemeColors(theme === 'dark');

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    if (systemColorScheme) {
      setTheme(systemColorScheme);
    }
  }, [systemColorScheme]);

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 