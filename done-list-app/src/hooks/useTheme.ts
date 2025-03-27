import { useState, useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { supabase } from '../lib/supabase';

export const useTheme = () => {
  const systemTheme = Appearance.getColorScheme() || 'light';
  const [theme, setTheme] = useState<ColorSchemeName>(systemTheme);
  
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('dark_mode')
          .single();
          
        if (error && error.code !== 'PGRST116') {
          console.error('Error loading theme preference:', error);
          return;
        }
        
        if (data && data.dark_mode !== null) {
          setTheme(data.dark_mode ? 'dark' : 'light');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    
    loadThemePreference();
  }, []);
  
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
  
  return { theme, toggleTheme };
};
