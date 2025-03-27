import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { HealthService } from '../services/HealthService';
import { Swipeable } from 'react-native-gesture-handler';
import { useTheme } from '../context/ThemeContext';
import { getThemeColors, spacing, borderRadius } from '../styles/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface Accomplishment {
  id: string;
  description: string;
  source: string;
  isHealthData: boolean;
}

type RootStackParamList = {
  Home: undefined;
  Questionnaire: undefined;
  Settings: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [accomplishments, setAccomplishments] = useState<Accomplishment[]>([]);
  const [newAccomplishment, setNewAccomplishment] = useState('');
  const [loading, setLoading] = useState(false);
  const [healthData, setHealthData] = useState<Accomplishment[]>([]);
  const [healthConnected, setHealthConnected] = useState(false);
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  
  useEffect(() => {
    fetchAccomplishments();
    checkHealthConnection();
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

  const fetchAccomplishments = async () => {
    setLoading(true);
    try {
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
          source: 'health',
          isHealthData: true
        })));
      }
    } catch (error) {
      console.error('Error fetching health data:', error);
    }
  };

  const addAccomplishment = async () => {
    if (!newAccomplishment.trim()) return;
    
    setLoading(true);
    try {
      const userResponse = await supabase.auth.getUser();
      
      if (!userResponse.data.user) {
        Alert.alert('Error', 'Not logged in');
        setLoading(false);
        return;
      }
      
      const userId = userResponse.data.user.id;
      
      const { error } = await supabase
        .from('accomplishments')
        .insert([
          { 
            description: newAccomplishment.trim(),
            user_id: userId,
            source: 'manual'
          }
        ]);
      
      if (error) {
        console.error('Error adding accomplishment:', error);
        throw error;
      }
      
      setNewAccomplishment('');
      fetchAccomplishments();
    } catch (error) {
      console.error('Error adding accomplishment:', error);
      Alert.alert('Error', 'Could not save accomplishment');
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
    setLoading(true);
    try {
      const userResponse = await supabase.auth.getUser();
      
      if (!userResponse.data.user) {
        Alert.alert('Error', 'Not logged in');
        setLoading(false);
        return;
      }
      
      const userId = userResponse.data.user.id;
      
      const items = healthData.map(item => ({
        description: item.description,
        user_id: userId,
        source: 'health'
      }));
      
      if (items.length === 0) return;
      
      const { error } = await supabase
        .from('accomplishments')
        .insert(items);
      
      if (error) throw error;
      
      Alert.alert('Success', 'Health data saved as accomplishments!');
      setHealthData([]);
      fetchAccomplishments();
    } catch (error) {
      console.error('Error saving health data:', error);
      Alert.alert('Error', 'Could not save health data as accomplishments');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Accomplishment }) => {
    const renderRightActions = () => (
      <TouchableOpacity
        style={[styles.deleteButton, { backgroundColor: colors.error }]}
        onPress={() => deleteAccomplishment(item.id)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    );

    return (
      <Swipeable renderRightActions={renderRightActions}>
        <View style={[
          styles.item,
          { backgroundColor: colors.surface },
          item.isHealthData && styles.healthItem
        ]}>
          <Text style={[styles.itemText, { color: colors.text }]}>{item.description}</Text>
          <Text style={[styles.sourceText, { color: colors.primary }]}>{item.source}</Text>
        </View>
      </Swipeable>
    );
  };

  // Combine manual accomplishments and health data
  const allAccomplishments = [...accomplishments, ...healthData];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing.lg,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: spacing.lg,
      color: colors.text,
    },
    inputContainer: {
      flexDirection: 'row',
      marginBottom: spacing.lg,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      padding: spacing.sm,
      borderRadius: borderRadius.md,
      marginRight: spacing.sm,
      fontSize: 16,
      backgroundColor: colors.surface,
      color: colors.text,
      borderColor: colors.border,
    },
    addButton: {
      padding: spacing.sm,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      width: 70,
      backgroundColor: colors.primary,
    },
    addButtonText: {
      color: 'white',
      fontWeight: '700',
      fontSize: 16,
    },
    loader: {
      marginVertical: spacing.lg,
    },
    item: {
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.sm,
    },
    healthItem: {
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    deleteButton: {
      justifyContent: 'center',
      alignItems: 'center',
      width: 100,
      height: '100%',
      backgroundColor: colors.error,
    },
    deleteButtonText: {
      color: 'white',
      fontWeight: '700',
      fontSize: 16,
    },
    itemText: {
      fontSize: 16,
      color: colors.text,
    },
    sourceText: {
      fontSize: 12,
      color: colors.primary,
      marginTop: spacing.xs,
    },
    emptyText: {
      textAlign: 'center',
      marginTop: spacing.xl,
      fontSize: 16,
      color: colors.textSecondary,
    },
    healthButton: {
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      marginTop: spacing.sm,
      marginBottom: spacing.lg,
      backgroundColor: colors.secondary,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    questionnaireButton: {
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      flex: 1,
      marginRight: spacing.sm,
      backgroundColor: colors.primary,
    },
    settingsButton: {
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      flex: 1,
      backgroundColor: colors.secondary,
    },
    buttonText: {
      color: 'white',
      fontWeight: '700',
      fontSize: 16,
    },
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Today's Accomplishments</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.surface,
            color: colors.text,
            borderColor: colors.border
          }]}
          placeholder="I accomplished..."
          placeholderTextColor={colors.textSecondary}
          value={newAccomplishment}
          onChangeText={setNewAccomplishment}
        />
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={addAccomplishment}
          disabled={loading}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} size="large" />
      ) : (
        <FlatList
          data={allAccomplishments}
          keyExtractor={(item, index) => item.id ? item.id.toString() : `item-${index}`}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No accomplishments yet today.
            </Text>
          }
        />
      )}
      
      {healthData.length > 0 && (
        <TouchableOpacity 
          style={[styles.healthButton, { backgroundColor: colors.secondary }]}
          onPress={saveHealthDataAsAccomplishments}
        >
          <Text style={styles.buttonText}>Save Health Data as Accomplishments</Text>
        </TouchableOpacity>
      )}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.questionnaireButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('Questionnaire')}
        >
          <Text style={styles.buttonText}>Daily Check-in</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.settingsButton, { backgroundColor: colors.secondary }]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.buttonText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
