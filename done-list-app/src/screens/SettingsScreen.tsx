import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { HealthService } from '../services/HealthService';

export default function SettingsScreen({ navigation }) {
  const [settings, setSettings] = useState({
    connectAppleHealth: false,
    connectTodoist: false,
    connectReminders: false,
    enableSummaries: false,
  });
  const [loading, setLoading] = useState(false);
  const [healthAvailable, setHealthAvailable] = useState(false);

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
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
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

  const toggleSetting = async (key) => {
    if (key === 'connectAppleHealth') {
      if (!settings.connectAppleHealth) {
        await requestHealthPermissions();
      } else {
        // If already connected, disconnect
        await updateHealthConnection(false);
      }
      return;
    }
    
    if (key === 'connectTodoist') {
      navigation.navigate('Todoist');
      return;
    }
    
    // Remove the reminders handling from here since we have a separate function
    // if (key === 'connectReminders') {
    //   navigation.navigate('Reminders');
    //   return;
    // }
    
    // Handle other settings
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [key]: !prev[key]
      };
      
      // Save the setting
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

  const updateHealthConnection = async (connected) => {
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
      
      // First check if a record already exists
      const { data, error: selectError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error checking for existing settings:', selectError);
        return;
      }
      
      // If record exists, update it; otherwise insert
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

  const saveSettings = async (newSettings) => {
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;
      
      if (!userId) {
        console.error('User not logged in');
        return;
      }
      
      // First check if a record already exists
      const { data, error: selectError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error checking for existing settings:', selectError);
        return;
      }
      
      // If record exists, update it; otherwise insert
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

  const toggleReminders = async (value) => {
    try {
      // Update local state first
      setSettings(prev => ({
        ...prev,
        connectReminders: value
      }));
      
      // Then update in the database
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
      
      // Show a success message
      if (value) {
        Alert.alert('Success', 'Reminders enabled');
      } else {
        Alert.alert('Success', 'Reminders disabled');
      }
    } catch (error) {
      console.error('Error toggling reminders:', error);
      Alert.alert('Error', 'Failed to update reminders settings');
      
      // Revert the UI state if the database update failed
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
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Integrations</Text>
        
        {healthAvailable ? (
          <View style={styles.settingContainer}>
            <Text style={styles.settingText}>Connect Apple Health</Text>
            <Switch
              value={settings.connectAppleHealth}
              onValueChange={() => toggleSetting('connectAppleHealth')}
              disabled={loading}
            />
          </View>
        ) : (
          <View style={styles.settingContainer}>
            <Text style={styles.settingText}>Apple Health (Not Available)</Text>
            <Switch
              value={false}
              disabled={true}
            />
          </View>
        )}
        
        <View style={styles.settingContainer}>
          <Text style={styles.settingText}>Connect Todoist</Text>
          <Switch
            value={settings.connectTodoist}
            onValueChange={() => toggleSetting('connectTodoist')}
          />
        </View>
        
        <View style={styles.settingContainer}>
          <Text style={styles.settingText}>Connect Reminders</Text>
          <Switch
            value={settings.connectReminders}
            onValueChange={toggleReminders}
            trackColor={{ false: "#767577", true: "#4CAF50" }}
            thumbColor={settings.connectReminders ? "#f5dd4b" : "#f4f3f4"}
          />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <View style={styles.settingContainer}>
          <Text style={styles.settingText}>Enable Daily Summaries</Text>
          <Switch
            value={settings.enableSummaries}
            onValueChange={() => toggleSetting('enableSummaries')}
          />
        </View>
      </View>
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4caf50" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.signOutButton}
        onPress={signOut}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#555',
  },
  settingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingText: {
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#555',
  },
  signOutButton: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
