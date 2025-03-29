import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../types/navigation';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, []);

  const handleUnauthorized = () => {
    if (!session) {
      navigation.navigate('Auth');
    }
  };

  return { session, loading, handleUnauthorized };
}
