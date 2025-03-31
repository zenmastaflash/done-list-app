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
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { useAuth } from './src/hooks/useAuth';
import { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

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
  const { colors } = useTheme();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
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
          options={{
            headerShown: false,
          }}
        />
      ) : (
        <>
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{
              title: 'Done List',
              headerShown: false,
            }}
          />
          <Stack.Screen 
            name="Questionnaire" 
            component={QuestionnaireScreen}
            options={{
              title: 'Daily Check-in',
            }}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen}
            options={{
              title: 'Settings',
            }}
          />
          <Stack.Screen 
            name="Todoist" 
            component={TodoistScreen}
            options={{
              title: 'Connect Todoist',
            }}
          />
          <Stack.Screen 
            name="Reminders" 
            component={RemindersScreen}
            options={{
              title: 'Connect Reminders',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

function MainContent() {
  const { colors } = useTheme();
  
  return (
    <>
      <StatusBar style="auto" backgroundColor={colors.background} />
      <NavigationContainer>
        <NavigationContent />
      </NavigationContainer>
    </>
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

  if (error) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ErrorFallback error={error} resetErrorBoundary={() => setError(null)} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  if (!isInitialized) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <LoadingScreen />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <SafeAreaProvider>
          <ThemeProvider>
            <MainContent />
          </ThemeProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
