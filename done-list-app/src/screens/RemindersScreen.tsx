import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, FlatList } from 'react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius, typography, commonStyles } from '../styles/globals';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RemindersService } from '../services/RemindersService';

type RemindersScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

interface Reminder {
  id: string;
  title: string;
  completionDate?: string;
}

export default function RemindersScreen({ navigation }: RemindersScreenProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completedReminders, setCompletedReminders] = useState<Reminder[]>([]);
  const { colors } = useTheme();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      
      if (!userId) {
        console.error('User not logged in');
        return;
      }
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('reminders_connected')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking reminders connection:', error);
        return;
      }
      
      if (data?.reminders_connected) {
        setIsConnected(true);
        fetchCompletedReminders();
      }
    } catch (error) {
      console.error('Error checking reminders settings:', error);
    }
  };

  const requestPermissions = async () => {
    setLoading(true);
    try {
      const remindersService = RemindersService.getInstance();
      const initialized = await remindersService.initialize();
      
      if (!initialized) {
        Alert.alert('Error', 'Could not initialize reminders. Please check your permissions.');
        return;
      }

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
          reminders_connected: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      if (error) throw error;
      
      setIsConnected(true);
      Alert.alert('Success', 'Connected to Reminders successfully!');
      fetchCompletedReminders();
    } catch (error) {
      console.error('Error connecting to Reminders:', error);
      Alert.alert('Error', 'Could not connect to Reminders');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedReminders = async () => {
    setLoading(true);
    try {
      const remindersService = RemindersService.getInstance();
      const reminders = await remindersService.getReminders();
      
      // Filter for completed reminders from today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayReminders = reminders
        .filter((reminder: any) => {
          // Check both completed flag and completion date
          return reminder.completed && reminder.completionDate && new Date(reminder.completionDate) >= today;
        })
        .map((reminder: any) => ({
          id: reminder.id,
          title: reminder.title,
          completionDate: reminder.completionDate
        }));
      
      setCompletedReminders(todayReminders);

      // Save to Supabase if there are completed reminders
      if (todayReminders.length > 0) {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        
        if (userId) {
          const reminderAccomplishments = todayReminders.map(reminder => ({
            description: `Completed: ${reminder.title}`,
            type: 'reminders' as const,
            user_id: userId,
            created_at: reminder.completionDate || new Date().toISOString(),
          }));

          const { error } = await supabase
            .from('accomplishments')
            .insert(reminderAccomplishments);

          if (error) {
            console.error('Error saving reminders to accomplishments:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
      Alert.alert('Error', 'Could not fetch completed reminders');
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = async (id: string) => {
    setLoading(true);
    try {
      const remindersService = RemindersService.getInstance();
      await remindersService.markAsCompleted(id);
      await fetchCompletedReminders(); // Refresh the list
      Alert.alert('Success', 'Reminder marked as completed!');
    } catch (error) {
      console.error('Error marking reminder as completed:', error);
      Alert.alert('Error', 'Could not mark reminder as completed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Apple Reminders</Text>
      
      {!isConnected ? (
        <>
          <Text style={[styles.instructions, { color: colors.textSecondary }]}>
            Connect to Apple Reminders to automatically track completed tasks as accomplishments.
          </Text>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]}
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
          <Text style={[styles.connectedText, { color: colors.success }]}>✅ Connected to Reminders</Text>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Completed Reminders Today</Text>
          
          {loading ? (
            <ActivityIndicator style={styles.loader} color={colors.primary} size="large" />
          ) : (
            <FlatList
              data={completedReminders}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={[styles.reminderItem, { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border
                }]}>
                  <Text style={[styles.reminderText, { color: colors.text }]}>{item.title}</Text>
                  {item.completionDate && (
                    <Text style={[styles.completionDate, { color: colors.textSecondary }]}>
                      {new Date(item.completionDate).toLocaleTimeString()}
                    </Text>
                  )}
                </View>
              )}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No completed reminders today.
                </Text>
              }
              style={styles.list}
            />
          )}
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={fetchCompletedReminders}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Refresh Reminders</Text>
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
  reminderItem: {
    ...commonStyles.shadow,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  reminderText: {
    ...typography.body,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  completionDate: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
});
