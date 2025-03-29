import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClientOptions, SupabaseClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

// Custom fetch implementation with longer timeout and retries
const customFetch = (url: string, options: RequestInit = {}): Promise<Response> => {
  const maxRetries = 3;
  const timeout = 30000; // 30 second timeout

  const attemptFetch = (retryCount: number): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    return fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
      },
    })
      .then(response => {
        clearTimeout(timeoutId);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response;
      })
      .catch(error => {
        clearTimeout(timeoutId);
        console.error(`Fetch error (attempt ${retryCount + 1}/${maxRetries}):`, error.message);
        
        if (retryCount < maxRetries) {
          const delay = 1000 * Math.pow(2, retryCount); // Exponential backoff
          console.log(`Retrying in ${delay}ms...`);
          return new Promise(resolve => setTimeout(resolve, delay))
            .then(() => attemptFetch(retryCount + 1));
        }
        throw error;
      });
  };

  return attemptFetch(0);
};

// Validate environment variables
const validateEnv = () => {
  if (!SUPABASE_URL) {
    console.error('SUPABASE_URL is missing from environment variables');
    return false;
  }
  if (!SUPABASE_ANON_KEY) {
    console.error('SUPABASE_ANON_KEY is missing from environment variables');
    return false;
  }
  return true;
};

const supabaseOptions = {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
  fetch: customFetch,
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
} as SupabaseClientOptions<'public'>;

// Initialize Supabase client
let supabase: SupabaseClient;
try {
  if (!validateEnv()) {
    throw new Error('Missing required environment variables');
  }
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, supabaseOptions);
  console.log('Supabase client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  throw error;
}

// Add error logging with more details
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    console.log('User signed out');
  } else if (event === 'SIGNED_IN') {
    console.log('User signed in');
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed');
  }
});

// Test the connection with error details and retry logic
const testConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('accomplishments').select('count').limit(1);
    if (error) {
      console.error('Supabase connection error:', {
        code: error.code,
        message: error.message,
        details: error.details,
      });
      return false;
    }
    console.log('Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('Fatal Supabase connection error:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
};

// Export the test function so it can be used elsewhere
export const initializeSupabase = async () => {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('Failed to initialize Supabase connection');
    }
    return isConnected;
  } catch (error) {
    console.error('Error during Supabase initialization:', error);
    return false;
  }
};

export { supabase };
