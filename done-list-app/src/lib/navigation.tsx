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
import { useTheme } from '../context/ThemeContext';
import { getThemeColors } from '../styles/theme';

const Stack = createStackNavigator();

export const Navigation = () => {
  const { session, loading } = useAuth();
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  
  if (loading) {
    return null; // Or a loading spinner
  }
  
  return (
    <NavigationContainer
      theme={{
        dark: theme === 'dark',
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.primary,
        },
        fonts: {
          regular: {
            fontFamily: 'System',
            fontWeight: '400',
          },
          medium: {
            fontFamily: 'System',
            fontWeight: '500',
          },
          bold: {
            fontFamily: 'System',
            fontWeight: '700',
          },
          heavy: {
            fontFamily: 'System',
            fontWeight: '900',
          },
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            color: colors.text,
          },
        }}
      >
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
