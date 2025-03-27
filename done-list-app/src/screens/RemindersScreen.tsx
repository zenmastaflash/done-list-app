import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, FlatList } from 'react-native';
import { supabase } from '../lib/supabase';

export default function RemindersScreen({ navigation }) {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completedReminders, setCompletedReminders] = useState([]);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      // Check if the record exists without checking for reminders_connected column
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching reminders settings:', error);
        return;
      }
      
      // Check if reminders is connected, default to false if it doesn't exist
      const connected = data && data.reminders_connected === true;
      setIsConnected(connected);
      if (connected) {
        fetchCompletedReminders();
      }
    } catch (error) {
      console.error('Error checking reminders connection:', error);
    }
  };

  const requestPermissions = async () => {
    setLoading(true);
    
    try {
      // In a production app, we would use the native EventKit APIs 
      // to request actual permission to access reminders
      
      // For this prototype, we'll simulate a permissions dialog
      const granted = await new Promise((resolve) => {
        Alert.alert(
          'Allow Access to Reminders',
          'Done List would like to access your reminders to track your accomplishments.',
          [
            { text: 'Don\'t Allow', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Allow', onPress: () => resolve(true) }
          ]
        );
      });
      
      if (granted) {
        setIsConnected(true);
        await saveConnection(true);
        fetchCompletedReminders();
        Alert.alert('Success', 'Connected to Reminders successfully!');
      }
    } catch (error) {
      console.error('Error requesting reminders permissions:', error);
      Alert.alert('Error', 'Could not connect to Reminders');
    } finally {
      setLoading(false);
    }
  };

  const saveConnection = async (connected) => {
    try {
      const userResponse = await supabase.auth.getUser();
      if (!userResponse.data.user) {
        throw new Error('User not authenticated');
      }
      
      const userId = userResponse.data.user.id;
      
      // First check if a record exists
      const { data, error: selectError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error checking for existing settings:', selectError);
        return;
      }
      
      // If record exists, update using PATCH instead of PUT to avoid overwriting other fields
      if (data) {
        const { error } = await supabase
          .from('user_settings')
          .update({ reminders_connected: connected })
          .eq('user_id', userId);
        
        if (error) {
          console.error('Error saving reminders connection:', error);
        }
      } else {
        // Insert new record if it doesn't exist
        const { error } = await supabase
          .from('user_settings')
          .insert({
            user_id: userId,
            reminders_connected: connected
          });
        
        if (error) {
          console.error('Error saving reminders connection:', error);
        }
      }
    } catch (error) {
      console.error('Error updating reminders connection:', error);
    }
  };

  const fetchCompletedReminders = async () => {
    setLoading(true);
    try {
      // In a production app, we would use the EventKit API to fetch real data
      // For this prototype, we'll use mock data
      const mockReminders = [
        { id: '1', title: 'Call doctor', completed: true },
        { id: '2', title: 'Take medication', completed: true },
        { id: '3', title: 'Pay rent', completed: true },
        { id: '4', title: 'Submit timesheet', completed: true },
        { id: '5', title: 'Buy groceries', completed: false }
      ].filter(item => item.completed);
      
      setCompletedReminders(mockReminders);
    } catch (error) {
      console.error('Error fetching completed reminders:', error);
      Alert.alert('Error', 'Could not fetch Reminders.');
    } finally {
      setLoading(false);
    }
  };

  const saveAsAccomplishments = async () => {
    if (completedReminders.length === 0) {
      Alert.alert('No Reminders', 'There are no completed reminders to save as accomplishments.');
      return;
    }
    
    setLoading(true);
    
    try {
      const userResponse = await supabase.auth.getUser();
      if (!userResponse.data.user) {
        throw new Error('User not authenticated');
      }
      
      const userId = userResponse.data.user.id;
      
      // Convert reminders to accomplishments
      const accomplishments = completedReminders.map(reminder => ({
        user_id: userId,
        description: `Completed reminder: ${reminder.title}`,
        source: 'reminders'
      }));
      
      const { error } = await supabase
        .from('accomplishments')
        .insert(accomplishments);
      
      if (error) {
        console.error('Error saving as accomplishments:', error);
        throw error;
      }
      
      Alert.alert('Success', 'Reminders saved as accomplishments!');
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Error', 'Could not save reminders as accomplishments');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Apple Reminders</Text>
      
      {!isConnected ? (
        <>
          <Text style={styles.instructions}>
            Connect to Apple Reminders to automatically track completed tasks as accomplishments.
          </Text>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={requestPermissions}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Connect to Reminders</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.connectedText}>✅ Connected to Reminders</Text>
          
          <Text style={styles.sectionTitle}>Completed Reminders Today</Text>
          
          {loading ? (
            <ActivityIndicator style={styles.loader} color="#4caf50" size="large" />
          ) : (
            <FlatList
              data={completedReminders}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.reminderItem}>
                  <Text style={styles.reminderText}>{item.title}</Text>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No completed reminders today.</Text>
              }
              style={styles.list}
            />
          )}
          
          <TouchableOpacity 
            style={styles.button}
            onPress={fetchCompletedReminders}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Refresh Reminders</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.saveButton]}
            onPress={saveAsAccomplishments}
            disabled={loading || completedReminders.length === 0}
          >
            <Text style={styles.buttonText}>Save as Accomplishments</Text>
          </TouchableOpacity>
        </>
      )}
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
  instructions: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#4caf50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: '#2196f3',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  connectedText: {
    fontSize: 18,
    color: '#4caf50',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#555',
  },
  list: {
    maxHeight: 300,
    marginBottom: 20,
  },
  reminderItem: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  reminderText: {
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: '#888',
  },
  loader: {
    marginVertical: 20,
  },
});
