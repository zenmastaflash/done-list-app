import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator, Platform, Modal, TouchableWithoutFeedback } from 'react-native';
import { supabase } from '../lib/supabase';
import { HealthService } from '../services/HealthService';
import { Swipeable } from 'react-native-gesture-handler';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius, typography, commonStyles } from '../styles/globals';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import type { Accomplishment } from '../types/accomplishment';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FrequentAccomplishmentsService } from '../services/FrequentAccomplishmentsService';
import { RemindersService } from '../services/RemindersService';

type RootStackParamList = {
  Home: undefined;
  Questionnaire: undefined;
  Settings: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const getAccomplishmentIcon = (type: string) => {
  switch (type) {
    case 'health':
      return 'heart';
    case 'todoist':
      return 'checkmark-circle';
    case 'reminders':
      return 'notifications';
    case 'manual':
      return 'add-circle';
    case 'questionnaire':
      return 'chatbubble-ellipses';
    default:
      return 'star';
  }
};

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { handleUnauthorized } = useAuth();
  const [accomplishments, setAccomplishments] = useState<Accomplishment[]>([]);
  const [newAccomplishment, setNewAccomplishment] = useState('');
  const [loading, setLoading] = useState(false);
  const [healthData, setHealthData] = useState<Accomplishment[]>([]);
  const [healthConnected, setHealthConnected] = useState(false);
  const theme = useTheme();
  const [frequentAccomplishments, setFrequentAccomplishments] = useState<string[]>([]);
  const frequentAccomplishmentsService = FrequentAccomplishmentsService.getInstance();
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [remindersData, setRemindersData] = useState<Accomplishment[]>([]);
  const [remindersConnected, setRemindersConnected] = useState(false);
  
  useFocusEffect(
    React.useCallback(() => {
      fetchAccomplishments();
      checkHealthConnection();
      checkRemindersConnection();
    }, [])
  );

  useEffect(() => {
    loadFrequentAccomplishments();
  }, []);

  const checkHealthConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('health_connected')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking health connection:', error);
        return;
      }
      
      if (data?.health_connected) {
        setHealthConnected(true);
        fetchHealthData();
      }
    } catch (error) {
      console.error('Error checking health settings:', error);
    }
  };

  const checkRemindersConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('reminders_connected')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking reminders connection:', error);
        return;
      }
      
      if (data?.reminders_connected) {
        setRemindersConnected(true);
        fetchRemindersData();
      }
    } catch (error) {
      console.error('Error checking reminders settings:', error);
    }
  };

  const fetchAccomplishments = async () => {
    setLoading(true);
    try {
      const userResponse = await supabase.auth.getUser();
      
      if (!userResponse.data.user) {
        handleUnauthorized();
        setLoading(false);
        return;
      }

      // Get today's date in ISO format (YYYY-MM-DD)
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('accomplishments')
        .select('*')
        .gte('created_at', today) // Only fetch items created today or later
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching accomplishments:', error);
        Alert.alert('Error', 'Could not load your accomplishments');
        return;
      }
      
      setAccomplishments(data || []);
    } catch (error) {
      console.error('Error fetching accomplishments:', error);
      Alert.alert('Error', 'Could not load your accomplishments');
    } finally {
      setLoading(false);
    }
  };

  const fetchHealthData = async () => {
    try {
      if (healthConnected && await HealthService.isAvailable()) {
        const healthAccomplishments = await HealthService.generateAccomplishments();
        setHealthData(healthAccomplishments.map((description, index) => ({
          id: `health-${index}`,
          description,
          type: 'health' as const,
          created_at: new Date().toISOString(),
          user_id: 'local'
        })));
      }
    } catch (error) {
      console.error('Error fetching health data:', error);
    }
  };

  const fetchRemindersData = async () => {
    try {
      const remindersService = RemindersService.getInstance();
      const reminders = await remindersService.getReminders();
      
      // Filter for completed reminders from today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const completedReminders = reminders
        .filter((reminder: any) => {
          const completionDate = new Date(reminder.completionDate);
          return completionDate >= today;
        })
        .map((reminder: any, index: number) => ({
          id: `reminder-${index}`,
          description: `Completed: ${reminder.title}`,
          type: 'reminders' as const,
          created_at: reminder.completionDate,
          user_id: 'local'
        }));
      
      setRemindersData(completedReminders);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  const loadFrequentAccomplishments = async () => {
    try {
      const frequent = await frequentAccomplishmentsService.getFrequentAccomplishments();
      // Filter out questionnaire accomplishments completely
      const filteredFrequent = frequent.filter(acc => 
        !acc.toLowerCase().includes('questionnaire') && 
        !acc.toLowerCase().includes('check-in') &&
        !acc.toLowerCase().includes('daily check-in') &&
        !acc.toLowerCase().includes('check in')
      );
      setFrequentAccomplishments(filteredFrequent);
    } catch (error) {
      console.error('Error loading frequent accomplishments:', error);
    }
  };

  const addAccomplishment = async () => {
    if (!newAccomplishment.trim()) return;

    setLoading(true);
    try {
      await frequentAccomplishmentsService.addAccomplishment(newAccomplishment.trim());
      setNewAccomplishment('');
      await loadAccomplishments();
      await loadFrequentAccomplishments();
    } catch (error) {
      console.error('Error adding accomplishment:', error);
      Alert.alert('Error', 'Failed to add accomplishment');
    } finally {
      setLoading(false);
    }
  };

  const deleteAccomplishment = async (id: string) => {
    try {
      // Only delete if it's a database item (not health data)
      if (typeof id === 'string' && id.startsWith('health-')) {
        // Just remove from state if it's health data
        setHealthData(prev => prev.filter(item => item.id !== id));
        return;
      }
      
      const { error } = await supabase
        .from('accomplishments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting accomplishment:', error);
        throw error;
      }

      setAccomplishments(prev => prev.filter(acc => acc.id !== id));
    } catch (error) {
      Alert.alert('Error', 'Failed to delete accomplishment');
    }
  };

  const saveHealthDataAsAccomplishments = async () => {
    try {
      const userResponse = await supabase.auth.getUser();
      
      if (!userResponse.data.user) {
        handleUnauthorized();
        return;
      }
      
      const userId = userResponse.data.user.id;
      
      const healthAccomplishments = healthData.map(acc => ({
        description: acc.description,
        type: 'health' as const,
        user_id: userId,
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('accomplishments')
        .insert(healthAccomplishments);

      if (error) {
        console.error('Error saving health data:', error);
        throw error;
      }

      await loadAccomplishments();
      Alert.alert('Success', 'Health data saved as accomplishments');
    } catch (error) {
      console.error('Error saving health data:', error);
      Alert.alert('Error', 'Failed to save health data');
    }
  };

  const saveRemindersAsAccomplishments = async () => {
    try {
      const userResponse = await supabase.auth.getUser();
      
      if (!userResponse.data.user) {
        handleUnauthorized();
        return;
      }
      
      const userId = userResponse.data.user.id;
      
      const reminderAccomplishments = remindersData.map(acc => ({
        description: acc.description,
        type: 'reminders' as const,
        user_id: userId,
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('accomplishments')
        .insert(reminderAccomplishments);

      if (error) {
        console.error('Error saving reminders data:', error);
        throw error;
      }

      await loadAccomplishments();
      setRemindersData([]); // Clear the local reminders data after saving
      Alert.alert('Success', 'Reminders saved as accomplishments');
    } catch (error) {
      console.error('Error saving reminders data:', error);
      Alert.alert('Error', 'Failed to save reminders data');
    }
  };

  const loadAccomplishments = async () => {
    setLoading(true);
    try {
      const userResponse = await supabase.auth.getUser();
      
      if (!userResponse.data.user) {
        handleUnauthorized();
        setLoading(false);
        return;
      }
      
      const userId = userResponse.data.user.id;
      
      const { data, error } = await supabase
        .from('accomplishments')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching accomplishments:', error);
        throw error;
      }
      
      setAccomplishments(data || []);
    } catch (error) {
      console.error('Error fetching accomplishments:', error);
      Alert.alert('Error', 'Failed to load accomplishments');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: any) => {
    if (event.key === 'Enter') {
      addAccomplishment();
    }
  };

  const renderAccomplishment = ({ item }: { item: Accomplishment }) => {
    if (!theme) return null;

    const renderRightActions = () => (
      <TouchableOpacity
        style={[styles.deleteButton, { backgroundColor: theme.colors.error }]}
        onPress={() => deleteAccomplishment(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color="white" />
      </TouchableOpacity>
    );

    return (
      <Swipeable renderRightActions={renderRightActions}>
        <View style={[styles.accomplishmentItem, { backgroundColor: theme.colors.card }]}>
          <View style={styles.accomplishmentContent}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
              <Ionicons 
                name={getAccomplishmentIcon(item.type)} 
                size={20} 
                color={theme.colors.primary} 
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.accomplishmentText, { color: theme.colors.text }]}>
                {item.description}
              </Text>
              <Text style={[styles.timestamp, { color: theme.colors.muted }]}>
                {new Date(item.created_at).toLocaleTimeString()}
              </Text>
            </View>
          </View>
        </View>
      </Swipeable>
    );
  };

  // Combine manual accomplishments and health data
  const allAccomplishments = [...accomplishments, ...healthData, ...remindersData];

  const styles = StyleSheet.create({
    container: {
      ...commonStyles.container,
    },
    title: {
      ...typography.h1,
      marginBottom: spacing.lg,
    },
    inputContainer: {
      ...commonStyles.row,
      marginBottom: spacing.lg,
    },
    inputWrapper: {
      flex: 1,
      position: 'relative',
    },
    input: {
      ...commonStyles.input,
      flex: 1,
      marginRight: spacing.sm,
    },
    addButton: {
      ...commonStyles.button,
      width: 70,
    },
    addButtonText: {
      ...typography.body,
      color: 'white',
      fontWeight: 'bold',
    },
    loader: {
      marginVertical: spacing.lg,
    },
    item: {
      ...commonStyles.shadow,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.sm,
    },
    healthItem: {
      borderLeftWidth: 4,
    },
    deleteButtonContainer: {
      width: 80,
      height: '100%',
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      marginVertical: 0,
      padding: 0,
      backgroundColor: theme.colors.error,
    },
    deleteButton: {
      ...commonStyles.center,
      width: 80,
      height: 60,
      backgroundColor: theme.colors.error,
    },
    itemText: {
      ...typography.body,
    },
    sourceText: {
      ...typography.caption,
      marginTop: spacing.xs,
    },
    emptyText: {
      ...typography.body,
      textAlign: 'center',
      marginTop: spacing.xl,
    },
    healthButton: {
      ...commonStyles.button,
      marginTop: spacing.sm,
      marginBottom: spacing.lg,
    },
    buttonContainer: {
      ...commonStyles.row,
      justifyContent: 'space-between',
    },
    questionnaireButton: {
      ...commonStyles.button,
      flex: 1,
      marginRight: spacing.sm,
    },
    settingsButton: {
      ...commonStyles.button,
      flex: 1,
    },
    buttonText: {
      ...typography.body,
      color: 'white',
      fontWeight: 'bold',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    countContainer: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    countText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
    accomplishmentContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      height: '100%',
    },
    accomplishmentItem: {
      ...commonStyles.shadow,
      padding: spacing.md,
      marginBottom: spacing.sm,
      backgroundColor: theme.colors.card,
      height: 60,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      ...commonStyles.center,
    },
    textContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    accomplishmentText: {
      ...typography.body,
    },
    timestamp: {
      ...typography.caption,
      marginTop: 2,
    },
    frequentAccomplishmentsContainer: {
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    frequentTitle: {
      ...typography.caption,
      marginBottom: spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    frequentAccomplishmentsList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    frequentAccomplishmentItem: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    frequentAccomplishmentText: {
      ...typography.caption,
    },
    countCard: {
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.lg,
      alignItems: 'center',
      ...commonStyles.shadow,
      zIndex: 1,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-start',
      paddingTop: 120, // Adjust this value based on your layout
    },
    dropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      zIndex: 1000,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      marginTop: 4,
      ...commonStyles.shadow,
      elevation: 5,
    },
    dropdownItem: {
      padding: spacing.sm,
    },
    dropdownText: {
      ...typography.body,
    },
  });

  if (!theme) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.countCard, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.countText, { color: theme.colors.text }]}>
          {accomplishments.length} accomplishment{accomplishments.length !== 1 ? 's' : ''} today!
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              borderColor: theme.colors.border
            }]}
            placeholder="I accomplished..."
            placeholderTextColor={theme.colors.textSecondary}
            value={newAccomplishment}
            onChangeText={setNewAccomplishment}
            onSubmitEditing={addAccomplishment}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => {
              // Small delay to allow for touch events
              setTimeout(() => setShowDropdown(false), 200);
            }}
            autoFocus={false}
          />
          {showDropdown && frequentAccomplishments.length > 0 && (
            <View style={[styles.dropdown, { 
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            }]}>
              {frequentAccomplishments.map((acc, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.dropdownItem, { 
                    borderBottomColor: theme.colors.border,
                    borderBottomWidth: index < frequentAccomplishments.length - 1 ? 1 : 0
                  }]}
                  onPress={() => {
                    setNewAccomplishment(acc);
                    setShowDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownText, { color: theme.colors.text }]}>
                    {acc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={addAccomplishment}
          disabled={loading}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <ActivityIndicator style={styles.loader} color={theme.colors.primary} size="large" />
      ) : (
        <FlatList
          data={allAccomplishments}
          keyExtractor={(item, index) => item.id ? item.id.toString() : `item-${index}`}
          renderItem={renderAccomplishment}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No accomplishments yet today.
            </Text>
          }
        />
      )}
      
      {healthData.length > 0 && (
        <TouchableOpacity 
          style={[styles.healthButton, { backgroundColor: theme.colors.secondary }]}
          onPress={saveHealthDataAsAccomplishments}
        >
          <Text style={styles.buttonText}>Save Health Data as Accomplishments</Text>
        </TouchableOpacity>
      )}
      
      {remindersData.length > 0 && (
        <TouchableOpacity 
          style={[styles.healthButton, { backgroundColor: theme.colors.secondary }]}
          onPress={saveRemindersAsAccomplishments}
        >
          <Text style={styles.buttonText}>Save Reminders as Accomplishments</Text>
        </TouchableOpacity>
      )}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.questionnaireButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('Questionnaire')}
        >
          <Text style={styles.buttonText}>Daily Check-in</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.settingsButton, { backgroundColor: theme.colors.secondary }]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.buttonText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
