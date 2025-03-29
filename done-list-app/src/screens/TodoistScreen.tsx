import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, FlatList } from 'react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius, typography, commonStyles } from '../styles/globals';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type TodoistScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export default function TodoistScreen({ navigation }: TodoistScreenProps) {
  const [apiToken, setApiToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const { colors } = useTheme();

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
    if (!apiToken) {
      Alert.alert('Error', 'Please enter your Todoist API token');
      return;
    }
    
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      
      if (!userId) {
        Alert.alert('Error', 'Not logged in');
        setLoading(false);
        return;
      }
      
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          todoist_token: apiToken,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      if (error) throw error;
      
      setIsConnected(true);
      await fetchCompletedTasks(apiToken);
    } catch (error) {
      console.error('Error connecting Todoist:', error);
      Alert.alert('Error', 'Could not connect to Todoist');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedTasks = async (token: string) => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const response = await fetch('https://api.todoist.com/rest/v2/tasks/completed', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch tasks');
      
      const data = await response.json();
      const todaysTasks = data.items.filter((item: any) => {
        const completedDate = new Date(item.completed_at);
        return completedDate >= today;
      }).map((item: any) => item.content);
      
      setCompletedTasks(todaysTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      Alert.alert('Error', 'Could not fetch completed tasks');
    } finally {
      setLoading(false);
    }
  };

  const saveAsAccomplishments = async () => {
    setLoading(true);
    try {
      const userResponse = await supabase.auth.getUser();
      const userId = userResponse.data.user?.id;
      
      if (!userId) {
        Alert.alert('Error', 'Not logged in');
        setLoading(false);
        return;
      }
      
      const items = completedTasks.map(description => ({
        description,
        user_id: userId,
        source: 'todoist'
      }));
      
      const { error } = await supabase
        .from('accomplishments')
        .insert(items);
      
      if (error) throw error;
      
      Alert.alert('Success', 'Tasks saved as accomplishments!');
      setCompletedTasks([]);
    } catch (error) {
      console.error('Error saving tasks:', error);
      Alert.alert('Error', 'Could not save tasks as accomplishments');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Connect to Todoist</Text>
      
      {!isConnected ? (
        <>
          <Text style={[styles.instructions, { color: colors.textSecondary }]}>
            To connect your Todoist account, please enter your API token.
            You can find your API token in Todoist's integration settings.
          </Text>
          
          <TextInput
            style={[styles.input, { 
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border
            }]}
            placeholder="Todoist API Token"
            placeholderTextColor={colors.textSecondary}
            value={apiToken}
            onChangeText={setApiToken}
            secureTextEntry
          />
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]}
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
          <Text style={[styles.connectedText, { color: colors.success }]}>✅ Connected to Todoist</Text>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Completed Tasks Today</Text>
          
          {loading ? (
            <ActivityIndicator style={styles.loader} color={colors.primary} size="large" />
          ) : (
            <FlatList
              data={completedTasks}
              keyExtractor={(item, index) => `task-${index}`}
              renderItem={({ item }) => (
                <View style={[styles.taskItem, { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border
                }]}>
                  <Text style={[styles.taskText, { color: colors.text }]}>{item}</Text>
                </View>
              )}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No completed tasks today.
                </Text>
              }
              style={styles.list}
            />
          )}
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => fetchCompletedTasks(apiToken)}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Refresh Tasks</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.secondary }]}
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
    ...commonStyles.container,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.md,
  },
  instructions: {
    ...typography.body,
    marginBottom: spacing.xl,
  },
  input: {
    ...commonStyles.input,
    marginBottom: spacing.lg,
  },
  button: {
    ...commonStyles.button,
    marginBottom: spacing.md,
  },
  buttonText: {
    ...typography.body,
    color: 'white',
    fontWeight: 'bold',
  },
  connectedText: {
    ...typography.h3,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  list: {
    flex: 1,
    marginBottom: spacing.lg,
  },
  taskItem: {
    ...commonStyles.shadow,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  taskText: {
    ...typography.body,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
