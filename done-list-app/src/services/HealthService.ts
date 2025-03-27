import { Alert, Platform } from 'react-native';

export class HealthService {
  // Check if Health is available on device
  static async isAvailable(): Promise<boolean> {
    // Health data is available only on iOS
    return Platform.OS === 'ios';
  }

  // Request permissions for Health data
  static async requestPermissions(): Promise<boolean> {
    try {
      // In a real implementation, we would use the actual Health API
      // Since we can't test it properly in Expo Go, show a confirmation dialog
      return new Promise((resolve) => {
        Alert.alert(
          'Health Data Permissions',
          'Would you like to connect to Apple Health to track your steps, distance, and activity?',
          [
            { 
              text: 'Cancel', 
              style: 'cancel',
              onPress: () => resolve(false)
            },
            {
              text: 'Allow',
              onPress: () => resolve(true)
            }
          ]
        );
      });
    } catch (error) {
      console.error('Error requesting Health permissions:', error);
      return false;
    }
  }

  // Generate health accomplishments
  static async generateAccomplishments(): Promise<string[]> {
    // For testing, return real-looking data that would come from Health
    const steps = Math.floor(Math.random() * 8000) + 2000; // 2000-10000 steps
    const distance = (steps * 0.0008).toFixed(2); // Rough conversion to km
    const calories = Math.floor(steps * 0.05); // Rough estimate
    
    return [
      `Walked ${steps.toLocaleString()} steps today`,
      `Walked ${distance} km today`,
      `Burned ${calories} active calories`
    ];
  }
}
