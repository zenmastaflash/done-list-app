import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from 'react-error-boundary';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initializeSupabase } from './src/lib/supabase';
import HomeScreen from './src/screens/HomeScreen';
import AuthScreen from './src/screens/AuthScreen';
import QuestionnaireScreen from './src/screens/QuestionnaireScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TodoistScreen from './src/screens/TodoistScreen';
import RemindersScreen from './src/screens/RemindersScreen';
import { View, Text, ActivityIndicator } from 'react-native';
import { ThemeProvider } from './src/context/ThemeContext';
import { useAuth } from './src/hooks/useAuth';

const Stack = createNativeStackNavigator();

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" />
    <Text style={{ marginTop: 10 }}>Initializing app...</Text>
  </View>
);

const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
    <Text style={{ fontSize: 18, marginBottom: 10, textAlign: 'center' }}>
      Something went wrong!
    </Text>
    <Text style={{ marginBottom: 20, textAlign: 'center', color: 'red' }}>
      {error.message}
    </Text>
    <Text
      style={{ color: 'blue', textDecorationLine: 'underline' }}
      onPress={resetErrorBoundary}
    >
      Try again
    </Text>
  </View>
);

function NavigationContent() {
  const { session, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator>
      {!session ? (
        <Stack.Screen 
          name="Auth" 
          component={AuthScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{
              title: 'Done List',
              headerStyle: {
                backgroundColor: '#f4511e',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          />
          <Stack.Screen 
            name="Questionnaire" 
            component={QuestionnaireScreen}
            options={{
              title: 'Daily Check-in',
              headerStyle: {
                backgroundColor: '#f4511e',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{
              title: 'Settings',
              headerStyle: {
                backgroundColor: '#f4511e',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          />
          <Stack.Screen 
            name="Todoist" 
            component={TodoistScreen}
            options={{
              title: 'Connect Todoist',
              headerStyle: {
                backgroundColor: '#f4511e',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          />
          <Stack.Screen 
            name="Reminders" 
            component={RemindersScreen}
            options={{
              title: 'Connect Reminders',
              headerStyle: {
                backgroundColor: '#f4511e',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('Starting app initialization...');
        const isConnected = await initializeSupabase();
        if (!isConnected) {
          throw new Error('Failed to connect to Supabase');
        }
        console.log('App initialization completed successfully');
        setIsInitialized(true);
      } catch (err) {
        console.error('App initialization error:', err);
        setError(err instanceof Error ? err : new Error('Unknown initialization error'));
      }
    };

    initApp();
  }, []);

  const AppContent = () => {
    if (error) {
      return (
        <SafeAreaProvider>
          <ErrorFallback error={error} resetErrorBoundary={() => setError(null)} />
        </SafeAreaProvider>
      );
    }

    if (!isInitialized) {
      return (
        <SafeAreaProvider>
          <LoadingScreen />
        </SafeAreaProvider>
      );
    }

    return (
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <SafeAreaProvider>
          <ThemeProvider>
            <NavigationContainer>
              <NavigationContent />
              <StatusBar style="auto" />
            </NavigationContainer>
          </ThemeProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppContent />
    </GestureHandlerRootView>
  );
}
