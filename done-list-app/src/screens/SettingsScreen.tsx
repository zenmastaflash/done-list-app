import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { HealthService } from '../services/HealthService';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius, typography, commonStyles } from '../styles/globals';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RemindersService } from '../services/RemindersService';

type SettingsScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

type SettingKey = 'connectAppleHealth' | 'connectTodoist' | 'connectReminders' | 'enableSummaries';

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const [settings, setSettings] = useState({
    connectAppleHealth: false,
    connectTodoist: false,
    connectReminders: false,
    enableSummaries: false,
  });
  const [loading, setLoading] = useState(false);
  const [healthAvailable, setHealthAvailable] = useState(false);
  const { theme, toggleTheme, colors } = useTheme();
  
  useEffect(() => {
    checkHealthAvailability();
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      
      if (!userId) {
        console.error('User not logged in');
        return;
      }
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching settings:', error);
        return;
      }
      
      if (data) {
        setSettings(prev => ({
          ...prev,
          connectAppleHealth: data.health_connected || false,
          connectTodoist: data.todoist_token ? true : false,
          connectReminders: data.reminders_connected || false,
          enableSummaries: data.enable_summaries || false,
        }));
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const checkHealthAvailability = async () => {
    try {
      const available = await HealthService.isAvailable();
      setHealthAvailable(available);
    } catch (error) {
      console.error('Error checking health availability:', error);
    }
  };

  const toggleSetting = async (key: SettingKey) => {
    if (key === 'connectAppleHealth') {
      if (!settings.connectAppleHealth) {
        await requestHealthPermissions();
      } else {
        await updateHealthConnection(false);
      }
      return;
    }
    
    if (key === 'connectTodoist') {
      navigation.navigate('Todoist');
      return;
    }
    
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [key]: !prev[key]
      };
      
      saveSettings(newSettings);
      
      return newSettings;
    });
  };

  const requestHealthPermissions = async () => {
    setLoading(true);
    
    try {
      const authorized = await HealthService.requestPermissions();
      
      if (authorized) {
        await updateHealthConnection(true);
        Alert.alert('Success', 'Health data connected successfully!');
      } else {
        Alert.alert('Permission Denied', 'Could not connect to Apple Health.');
      }
    } catch (error) {
      console.error('Error requesting health permissions:', error);
      Alert.alert('Error', 'Could not connect to Apple Health');
    } finally {
      setLoading(false);
    }
  };

  const updateHealthConnection = async (connected: boolean) => {
    setSettings(prev => ({
      ...prev,
      connectAppleHealth: connected
    }));
    
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;
      
      if (!userId) {
        console.error('User not logged in');
        return;
      }
      
      const { data, error: selectError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error checking for existing settings:', selectError);
        return;
      }
      
      const operation = data ? 
        supabase.from('user_settings').update({
          health_connected: connected,
          updated_at: new Date().toISOString()
        }).eq('user_id', userId) :
        supabase.from('user_settings').insert({
          user_id: userId,
          health_connected: connected,
          updated_at: new Date().toISOString()
        });
      
      const { error } = await operation;
      
      if (error) {
        console.error('Error saving health connection:', error);
      }
    } catch (error) {
      console.error('Error updating health connection:', error);
    }
  };

  const saveSettings = async (newSettings: typeof settings) => {
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;
      
      if (!userId) {
        console.error('User not logged in');
        return;
      }
      
      const { data, error: selectError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error checking for existing settings:', selectError);
        return;
      }
      
      const operation = data ? 
        supabase.from('user_settings').update({
          enable_summaries: newSettings.enableSummaries,
          updated_at: new Date().toISOString()
        }).eq('user_id', userId) :
        supabase.from('user_settings').insert({
          user_id: userId,
          enable_summaries: newSettings.enableSummaries,
          updated_at: new Date().toISOString()
        });
      
      const { error } = await operation;
      
      if (error) {
        console.error('Error saving settings:', error);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const toggleReminders = async (value: boolean) => {
    try {
      if (value) {
        // Try to initialize reminders first
        const remindersService = RemindersService.getInstance();
        const initialized = await remindersService.initialize();
        
        if (!initialized) {
          Alert.alert('Error', 'Could not initialize reminders. Please check your permissions.');
          return;
        }
      }

      setSettings(prev => ({
        ...prev,
        connectReminders: value
      }));
      
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      
      if (!userId) {
        console.error('User not logged in');
        return;
      }
      
      const { error } = await supabase
        .from('user_settings')
        .update({ reminders_connected: value })
        .eq('user_id', userId);
      
      if (error) throw error;
      
      if (value) {
        Alert.alert('Success', 'Reminders enabled');
      } else {
        Alert.alert('Success', 'Reminders disabled');
      }
    } catch (error) {
      console.error('Error toggling reminders:', error);
      Alert.alert('Error', 'Failed to update reminders settings');
      
      setSettings(prev => ({
        ...prev,
        connectReminders: !value
      }));
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Error signing out:', error.message);
  };

  return (
    <View style={[commonStyles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Appearance</Text>
        
        <View style={[styles.settingContainer, { borderBottomColor: colors.border }]}>
          <Text style={[styles.settingText, { color: colors.text }]}>Dark Mode</Text>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={colors.switchTrack}
            thumbColor={colors.switchThumb[theme === 'dark' ? 'true' : 'false']}
          />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Integrations</Text>
        
        {healthAvailable ? (
          <View style={[styles.settingContainer, { borderBottomColor: colors.border }]}>
            <Text style={[styles.settingText, { color: colors.text }]}>Connect Apple Health</Text>
            <Switch
              value={settings.connectAppleHealth}
              onValueChange={() => toggleSetting('connectAppleHealth')}
              disabled={loading}
              trackColor={colors.switchTrack}
              thumbColor={colors.switchThumb[settings.connectAppleHealth ? 'true' : 'false']}
            />
          </View>
        ) : (
          <View style={[styles.settingContainer, { borderBottomColor: colors.border }]}>
            <Text style={[styles.settingText, { color: colors.textSecondary }]}>Apple Health (Not Available)</Text>
            <Switch
              value={false}
              disabled={true}
              trackColor={colors.switchTrack}
              thumbColor={colors.switchThumb.false}
            />
          </View>
        )}
        
        <View style={[styles.settingContainer, { borderBottomColor: colors.border }]}>
          <Text style={[styles.settingText, { color: colors.text }]}>Connect Todoist</Text>
          <Switch
            value={settings.connectTodoist}
            onValueChange={() => toggleSetting('connectTodoist')}
            trackColor={colors.switchTrack}
            thumbColor={colors.switchThumb[settings.connectTodoist ? 'true' : 'false']}
          />
        </View>
        
        <View style={[styles.settingContainer, { borderBottomColor: colors.border }]}>
          <Text style={[styles.settingText, { color: colors.text }]}>Connect Reminders</Text>
          <View style={styles.settingControls}>
            {settings.connectReminders && (
              <TouchableOpacity 
                style={[styles.settingButton, { backgroundColor: colors.primary, marginRight: spacing.sm }]}
                onPress={() => navigation.navigate('Reminders')}
              >
                <Text style={[styles.buttonText, { color: 'white' }]}>Manage</Text>
              </TouchableOpacity>
            )}
            <Switch
              value={settings.connectReminders}
              onValueChange={toggleReminders}
              trackColor={colors.switchTrack}
              thumbColor={colors.switchThumb[settings.connectReminders ? 'true' : 'false']}
            />
          </View>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Preferences</Text>
        
        <View style={[styles.settingContainer, { borderBottomColor: colors.border }]}>
          <Text style={[styles.settingText, { color: colors.text }]}>Enable Daily Summaries</Text>
          <Switch
            value={settings.enableSummaries}
            onValueChange={() => toggleSetting('enableSummaries')}
            trackColor={colors.switchTrack}
            thumbColor={colors.switchThumb[settings.enableSummaries ? 'true' : 'false']}
          />
        </View>
      </View>
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Processing...</Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={[styles.signOutButton, { backgroundColor: colors.error }]}
        onPress={signOut}
        disabled={loading}
      >
        <Text style={[styles.buttonText, { color: colors.background }]}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.h1,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  settingContainer: {
    ...commonStyles.row,
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  settingText: {
    ...typography.body,
  },
  loadingContainer: {
    ...commonStyles.center,
    marginVertical: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.sm,
  },
  signOutButton: {
    ...commonStyles.button,
    marginTop: 'auto',
  },
  settingControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingButton: {
    padding: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  buttonText: {
    ...typography.body,
    fontWeight: 'bold',
  },
});
