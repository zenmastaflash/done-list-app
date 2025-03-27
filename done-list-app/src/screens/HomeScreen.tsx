import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { HealthService } from '../services/HealthService';

export default function HomeScreen({ navigation }) {
  const [accomplishments, setAccomplishments] = useState([]);
  const [newAccomplishment, setNewAccomplishment] = useState('');
  const [loading, setLoading] = useState(false);
  const [healthData, setHealthData] = useState([]);
  const [healthConnected, setHealthConnected] = useState(false);
  
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
      const { data, error } = await supabase
        .from('accomplishments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
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
      // Get current user
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

  const saveHealthDataAsAccomplishments = async () => {
    setLoading(true);
    try {
      // Get current user
      const userResponse = await supabase.auth.getUser();
      
      if (!userResponse.data.user) {
        Alert.alert('Error', 'Not logged in');
        setLoading(false);
        return;
      }
      
      const userId = userResponse.data.user.id;
      
      // Convert health data to accomplishments
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

  // Combine manual accomplishments and health data
  const allAccomplishments = [...accomplishments, ...healthData];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today's Accomplishments</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="I accomplished..."
          value={newAccomplishment}
          onChangeText={setNewAccomplishment}
        />
        <TouchableOpacity 
          style={styles.addButton}
          onPress={addAccomplishment}
          disabled={loading}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <ActivityIndicator style={styles.loader} color="#4caf50" size="large" />
      ) : (
        <FlatList
          data={allAccomplishments}
          keyExtractor={(item, index) => item.id ? item.id.toString() : `item-${index}`}
          renderItem={({ item }) => (
            <View style={item.isHealthData ? [styles.item, styles.healthItem] : styles.item}>
              <Text style={styles.itemText}>{item.description}</Text>
              {item.source && (
                <Text style={styles.sourceText}>
                  {item.source === 'todoist' ? 'From Todoist' : 
                   item.source === 'health' ? 'From Health' : ''}
                </Text>
              )}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No accomplishments yet today.</Text>
          }
        />
      )}
      
      {healthData.length > 0 && (
        <TouchableOpacity 
          style={styles.healthButton}
          onPress={saveHealthDataAsAccomplishments}
        >
          <Text style={styles.buttonText}>Save Health Data as Accomplishments</Text>
        </TouchableOpacity>
      )}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.questionnaireButton}
          onPress={() => navigation.navigate('Questionnaire')}
        >
          <Text style={styles.buttonText}>Daily Check-in</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.buttonText}>Settings</Text>
        </TouchableOpacity>
      </View>
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
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#4caf50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loader: {
    marginVertical: 20,
  },
  item: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  healthItem: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  itemText: {
    fontSize: 16,
  },
  sourceText: {
    fontSize: 12,
    color: '#2196f3',
    marginTop: 5,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#888',
  },
  healthButton: {
    backgroundColor: '#2196f3',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  questionnaireButton: {
    backgroundColor: '#9c27b0',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  settingsButton: {
    backgroundColor: '#607d8b',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
