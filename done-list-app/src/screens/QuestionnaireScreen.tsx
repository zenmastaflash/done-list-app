import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

export default function QuestionnaireScreen({ navigation }) {
  const [responses, setResponses] = useState({
    got_out_of_bed: false,
    brushed_teeth: false,
    drank_water: false,
    saw_sunlight: false,
    moved_body: false,
    connected_with_someone: false,
  });
  const [loading, setLoading] = useState(false);

  const toggleSwitch = (key) => {
    setResponses(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const saveResponses = async () => {
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
      const date = new Date().toISOString().split('T')[0];
      
      // First try to delete any existing record for today to avoid constraint issues
      await supabase
        .from('questionnaire_responses')
        .delete()
        .eq('user_id', userId)
        .eq('date', date);
        
      // Now insert the new responses
      const { error } = await supabase
        .from('questionnaire_responses')
        .insert({
          user_id: userId,
          date: date,
          got_out_of_bed: responses.got_out_of_bed,
          brushed_teeth: responses.brushed_teeth,
          drank_water: responses.drank_water,
          saw_sunlight: responses.saw_sunlight,
          moved_body: responses.moved_body,
          connected_with_someone: responses.connected_with_someone
        });
      
      if (error) {
        console.error('Error saving responses:', error);
        throw error;
      }
      
      // Now, create accomplishments from checked items
      const accomplishments = [];
      if (responses.got_out_of_bed) accomplishments.push("Got out of bed today");
      if (responses.brushed_teeth) accomplishments.push("Brushed my teeth");
      if (responses.drank_water) accomplishments.push("Drank water");
      if (responses.saw_sunlight) accomplishments.push("Saw sunlight");
      if (responses.moved_body) accomplishments.push("Moved my body");
      if (responses.connected_with_someone) accomplishments.push("Connected with someone");
      
      if (accomplishments.length > 0) {
        const { error: insertError } = await supabase
          .from('accomplishments')
          .insert(accomplishments.map(description => ({
            user_id: userId,
            description,
            source: 'questionnaire'
          })));
        
        if (insertError) {
          console.error('Error saving accomplishments:', insertError);
          throw insertError;
        }
      }
      
      Alert.alert('Success', 'Your daily check-in has been saved!');
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Error', 'Failed to save your check-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Daily Check-in</Text>
      <Text style={styles.subtitle}>Let's acknowledge what you've accomplished today:</Text>
      
      <View style={styles.questionContainer}>
        <Text style={styles.question}>I got out of bed today</Text>
        <Switch
          value={responses.got_out_of_bed}
          onValueChange={() => toggleSwitch('got_out_of_bed')}
        />
      </View>
      
      <View style={styles.questionContainer}>
        <Text style={styles.question}>I brushed my teeth</Text>
        <Switch
          value={responses.brushed_teeth}
          onValueChange={() => toggleSwitch('brushed_teeth')}
        />
      </View>
      
      <View style={styles.questionContainer}>
        <Text style={styles.question}>I drank some water</Text>
        <Switch
          value={responses.drank_water}
          onValueChange={() => toggleSwitch('drank_water')}
        />
      </View>
      
      <View style={styles.questionContainer}>
        <Text style={styles.question}>I saw sunlight</Text>
        <Switch
          value={responses.saw_sunlight}
          onValueChange={() => toggleSwitch('saw_sunlight')}
        />
      </View>
      
      <View style={styles.questionContainer}>
        <Text style={styles.question}>I moved my body</Text>
        <Switch
          value={responses.moved_body}
          onValueChange={() => toggleSwitch('moved_body')}
        />
      </View>
      
      <View style={styles.questionContainer}>
        <Text style={styles.question}>I connected with someone</Text>
        <Switch
          value={responses.connected_with_someone}
          onValueChange={() => toggleSwitch('connected_with_someone')}
        />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4caf50" />
          <Text style={styles.loadingText}>Saving your check-in...</Text>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={saveResponses}
        >
          <Text style={styles.saveButtonText}>Save My Day</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
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
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 30,
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  question: {
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 50,
  },
  loadingText: {
    marginTop: 10,
    color: '#555',
  },
  saveButton: {
    backgroundColor: '#4caf50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 50,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
