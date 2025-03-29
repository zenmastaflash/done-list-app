import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, ColorSchemeName } from 'react-native';
import { supabase } from '../lib/supabase';
import { ThemeColors, getThemeColors } from '../styles/globals';

interface ThemeContextType {
  theme: ColorSchemeName;
  toggleTheme: () => Promise<void>;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: async () => {},
  colors: getThemeColors('light'),
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemTheme = useColorScheme() || 'light';
  const [theme, setTheme] = useState<ColorSchemeName>(systemTheme);
  const colors = getThemeColors(theme);
  
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        // First check if we're authenticated
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) {
          // If not authenticated, just use system theme
          setTheme(systemTheme);
          return;
        }

        const { data, error } = await supabase
          .from('user_settings')
          .select('dark_mode')
          .single();
          
        if (error && error.code !== 'PGRST116') {
          console.error('Error loading theme preference:', error);
          setTheme(systemTheme);
          return;
        }
        
        if (data && data.dark_mode !== null) {
          setTheme(data.dark_mode ? 'dark' : 'light');
        } else {
          setTheme(systemTheme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
        setTheme(systemTheme);
      }
    };
    
    loadThemePreference();
  }, [systemTheme]);
  
  const toggleTheme = async () => {
    try {
      const newTheme = theme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userData.user.id,
          dark_mode: newTheme === 'dark'
        }, { onConflict: 'user_id' });
        
      if (error) {
        console.error('Error saving theme preference:', error);
      }
    } catch (error) {
      console.error('Error toggling theme:', error);
    }
  };
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext); 