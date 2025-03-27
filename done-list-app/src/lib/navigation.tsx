import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import AuthScreen from '../screens/AuthScreen';
import QuestionnaireScreen from '../screens/QuestionnaireScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TodoistScreen from '../screens/TodoistScreen';
import RemindersScreen from '../screens/RemindersScreen';
import { useAuth } from '../hooks/useAuth';

const Stack = createStackNavigator();

export const Navigation = () => {
  const { session, loading } = useAuth();
  
  if (loading) {
    return null; // Or a loading spinner
  }
  
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!session ? (
          <Stack.Screen 
            name="Auth" 
            component={AuthScreen} 
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Questionnaire" component={QuestionnaireScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Todoist" component={TodoistScreen} options={{ title: 'Connect Todoist' }} />
            <Stack.Screen name="Reminders" component={RemindersScreen} options={{ title: 'Connect Reminders' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
