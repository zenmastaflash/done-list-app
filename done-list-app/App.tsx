import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from 'react-error-boundary';
import { initializeSupabase } from './src/lib/supabase';
import HomeScreen from './src/screens/HomeScreen';
import { View, Text, ActivityIndicator } from 'react-native';
import { ThemeProvider } from './src/context/ThemeContext';

const Stack = createNativeStackNavigator();

// Temporary placeholder for AddAccomplishmentScreen
const AddAccomplishmentScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Add Accomplishment Screen</Text>
  </View>
);

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
            <Stack.Navigator>
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
                name="AddAccomplishment" 
                component={AddAccomplishmentScreen}
                options={{
                  title: 'Add Accomplishment',
                  headerStyle: {
                    backgroundColor: '#f4511e',
                  },
                  headerTintColor: '#fff',
                  headerTitleStyle: {
                    fontWeight: 'bold',
                  },
                }}
              />
            </Stack.Navigator>
            <StatusBar style="auto" />
          </NavigationContainer>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
