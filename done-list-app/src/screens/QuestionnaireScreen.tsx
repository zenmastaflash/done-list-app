import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius, typography, commonStyles } from '../styles/globals';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type QuestionnaireScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

type QuestionnaireResponses = {
  got_out_of_bed: boolean;
  brushed_teeth: boolean;
  drank_water: boolean;
  saw_sunlight: boolean;
  moved_body: boolean;
  connected_with_someone: boolean;
};

type ResponseKey = keyof QuestionnaireResponses;

export default function QuestionnaireScreen({ navigation }: QuestionnaireScreenProps) {
  const [responses, setResponses] = useState<QuestionnaireResponses>({
    got_out_of_bed: false,
    brushed_teeth: false,
    drank_water: false,
    saw_sunlight: false,
    moved_body: false,
    connected_with_someone: false,
  });
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();

  const toggleSwitch = (key: ResponseKey) => {
    setResponses(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const saveResponses = async () => {
    setLoading(true);
    try {
      const userResponse = await supabase.auth.getUser();
      
      if (!userResponse.data.user) {
        Alert.alert('Error', 'Not logged in');
        setLoading(false);
        return;
      }
      
      const userId = userResponse.data.user.id;
      const date = new Date().toISOString().split('T')[0];
      
      // Use upsert instead of insert to handle the unique constraint
      const { error } = await supabase
        .from('questionnaire_responses')
        .upsert({
          user_id: userId,
          date: date,
          got_out_of_bed: responses.got_out_of_bed,
          brushed_teeth: responses.brushed_teeth,
          drank_water: responses.drank_water,
          saw_sunlight: responses.saw_sunlight,
          moved_body: responses.moved_body,
          connected_with_someone: responses.connected_with_someone
        }, { onConflict: 'user_id,date' });
      
      if (error) {
        console.error('Error saving responses:', error);
        throw error;
      }
      
      // Create accomplishments from checked items
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
      // Reset navigation stack to Home screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to save your check-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Daily Check-in</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Let's acknowledge what you've accomplished today:
      </Text>
      
      <View style={[styles.questionContainer, { borderBottomColor: colors.border }]}>
        <Text style={[styles.question, { color: colors.text }]}>I got out of bed today</Text>
        <Switch
          value={responses.got_out_of_bed}
          onValueChange={() => toggleSwitch('got_out_of_bed')}
          trackColor={colors.switchTrack}
          thumbColor={colors.switchThumb[responses.got_out_of_bed ? 'true' : 'false']}
        />
      </View>
      
      <View style={[styles.questionContainer, { borderBottomColor: colors.border }]}>
        <Text style={[styles.question, { color: colors.text }]}>I brushed my teeth</Text>
        <Switch
          value={responses.brushed_teeth}
          onValueChange={() => toggleSwitch('brushed_teeth')}
          trackColor={colors.switchTrack}
          thumbColor={colors.switchThumb[responses.brushed_teeth ? 'true' : 'false']}
        />
      </View>
      
      <View style={[styles.questionContainer, { borderBottomColor: colors.border }]}>
        <Text style={[styles.question, { color: colors.text }]}>I drank some water</Text>
        <Switch
          value={responses.drank_water}
          onValueChange={() => toggleSwitch('drank_water')}
          trackColor={colors.switchTrack}
          thumbColor={colors.switchThumb[responses.drank_water ? 'true' : 'false']}
        />
      </View>
      
      <View style={[styles.questionContainer, { borderBottomColor: colors.border }]}>
        <Text style={[styles.question, { color: colors.text }]}>I saw sunlight</Text>
        <Switch
          value={responses.saw_sunlight}
          onValueChange={() => toggleSwitch('saw_sunlight')}
          trackColor={colors.switchTrack}
          thumbColor={colors.switchThumb[responses.saw_sunlight ? 'true' : 'false']}
        />
      </View>
      
      <View style={[styles.questionContainer, { borderBottomColor: colors.border }]}>
        <Text style={[styles.question, { color: colors.text }]}>I moved my body</Text>
        <Switch
          value={responses.moved_body}
          onValueChange={() => toggleSwitch('moved_body')}
          trackColor={colors.switchTrack}
          thumbColor={colors.switchThumb[responses.moved_body ? 'true' : 'false']}
        />
      </View>
      
      <View style={[styles.questionContainer, { borderBottomColor: colors.border }]}>
        <Text style={[styles.question, { color: colors.text }]}>I connected with someone</Text>
        <Switch
          value={responses.connected_with_someone}
          onValueChange={() => toggleSwitch('connected_with_someone')}
          trackColor={colors.switchTrack}
          thumbColor={colors.switchThumb[responses.connected_with_someone ? 'true' : 'false']}
        />
      </View>
      
      <TouchableOpacity 
        style={[styles.saveButton, { backgroundColor: colors.primary }]}
        onPress={saveResponses}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Save Check-in</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
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
  subtitle: {
    ...typography.body,
    marginBottom: spacing.xl,
  },
  questionContainer: {
    ...commonStyles.row,
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    marginBottom: spacing.md,
  },
  question: {
    ...typography.body,
    flex: 1,
    marginRight: spacing.md,
  },
  saveButton: {
    ...commonStyles.button,
    marginTop: spacing.xl,
  },
  buttonText: {
    ...typography.body,
    color: 'white',
    fontWeight: 'bold',
  },
});
