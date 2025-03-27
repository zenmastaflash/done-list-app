import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, FlatList } from 'react-native';
import { supabase } from '../lib/supabase';

export default function TodoistScreen({ navigation }) {
  const [apiToken, setApiToken] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completedTasks, setCompletedTasks] = useState([]);

  useEffect(() => {
    // Check if we already have a token saved
    checkSavedToken();
  }, []);

  const checkSavedToken = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('todoist_token')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching token:', error);
        return;
      }
      
      if (data?.todoist_token) {
        setApiToken(data.todoist_token);
        setIsConnected(true);
        fetchCompletedTasks(data.todoist_token);
      }
    } catch (error) {
      console.error('Error checking saved token:', error);
    }
  };

  const connectTodoist = async () => {
    if (!apiToken.trim()) {
      Alert.alert('Error', 'Please enter your Todoist API token');
      return;
    }
    
    setLoading(true);
    
    try {
      // In a production app, we would verify this token 
      // is valid by making an API call to Todoist
      
      // For this prototype, we'll simulate a successful connection
      setIsConnected(true);
      await saveApiToken(apiToken.trim());
      await fetchCompletedTasks(apiToken.trim());
      Alert.alert('Success', 'Connected to Todoist successfully!');
    } catch (error) {
      console.error('Error connecting to Todoist:', error);
      Alert.alert('Error', 'Failed to connect to Todoist. Please check your API token.');
    } finally {
      setLoading(false);
    }
  };

  const saveApiToken = async (token) => {
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;
      
      if (!userId) {
        console.error('User not logged in');
        return;
      }
      
      // Check if settings record exists
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
          todoist_token: token,
          updated_at: new Date().toISOString()
        }).eq('user_id', userId) :
        supabase.from('user_settings').insert({
          user_id: userId,
          todoist_token: token,
          updated_at: new Date().toISOString()
        });
      
      const { error } = await operation;
      
      if (error) {
        console.error('Error saving token:', error);
      }
    } catch (error) {
      console.error('Error saving API token:', error);
    }
  };

  const fetchCompletedTasks = async (token) => {
    setLoading(true);
    try {
      // In a production app, we would use the Todoist API to fetch real data
      // For this prototype, we'll use mock data
      const mockTasks = [
        'Complete project proposal',
        'Reply to client emails',
        'Schedule team meeting',
        'Update documentation',
        'Finish bug fixes for release'
      ];
      
      setCompletedTasks(mockTasks);
    } catch (error) {
      console.error('Error fetching completed tasks:', error);
      Alert.alert('Error', 'Could not fetch Todoist tasks.');
    } finally {
      setLoading(false);
    }
  };

  const saveAsAccomplishments = async () => {
    if (completedTasks.length === 0) {
      Alert.alert('No Tasks', 'There are no completed tasks to save as accomplishments.');
      return;
    }
    
    setLoading(true);
    
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;
      
      if (!userId) {
        Alert.alert('Error', 'Not logged in');
        return;
      }
      
      // Convert tasks to accomplishments
      const accomplishments = completedTasks.map(task => ({
        user_id: userId,
        description: `Completed Todoist task: ${task}`,
        source: 'todoist'
      }));
      
      const { error } = await supabase
        .from('accomplishments')
        .insert(accomplishments);
      
      if (error) {
        console.error('Error saving as accomplishments:', error);
        throw error;
      }
      
      Alert.alert('Success', 'Tasks saved as accomplishments!');
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Error', 'Could not save tasks as accomplishments');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connect to Todoist</Text>
      
      {!isConnected ? (
        <>
          <Text style={styles.instructions}>
            To connect your Todoist account, please enter your API token.
            You can find your API token in Todoist's integration settings.
          </Text>
          
          <TextInput
            style={styles.input}
            placeholder="Todoist API Token"
            value={apiToken}
            onChangeText={setApiToken}
            secureTextEntry
          />
          
          <TouchableOpacity 
            style={styles.button}
            onPress={connectTodoist}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Connect</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.connectedText}>✅ Connected to Todoist</Text>
          
          <Text style={styles.sectionTitle}>Completed Tasks Today</Text>
          
          {loading ? (
            <ActivityIndicator style={styles.loader} color="#4caf50" size="large" />
          ) : (
            <FlatList
              data={completedTasks}
              keyExtractor={(item, index) => `task-${index}`}
              renderItem={({ item }) => (
                <View style={styles.taskItem}>
                  <Text style={styles.taskText}>{item}</Text>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No completed tasks today.</Text>
              }
              style={styles.list}
            />
          )}
          
          <TouchableOpacity 
            style={styles.button}
            onPress={() => fetchCompletedTasks(apiToken)}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Refresh Tasks</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.saveButton]}
            onPress={saveAsAccomplishments}
            disabled={loading || completedTasks.length === 0}
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
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 15,
    borderRadius: 5,
    fontSize: 16,
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
  taskItem: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  taskText: {
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
