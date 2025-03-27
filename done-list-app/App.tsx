import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { Navigation } from './src/lib/navigation';
import { supabase } from './src/lib/supabase';
import { View, Text } from 'react-native';

export default function App() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      // Initialize app
      setInitialized(true);
    };
    
    initialize();
  }, []);

  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return <Navigation />;
}
