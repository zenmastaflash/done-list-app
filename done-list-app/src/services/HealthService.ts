import { Platform } from 'react-native';
import AppleHealthKit, {
  HealthKitPermissions,
  HealthValue,
} from 'react-native-health';

// Define the permissions your app will request
const PERMISSIONS = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.Steps,
      AppleHealthKit.Constants.Permissions.DistanceWalking,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
    ],
    write: [],
  },
} as HealthKitPermissions;

export class HealthService {
  static isInitialized = false;

  // Check if Health is available on device
  static async isAvailable(): Promise<boolean> {
    // For iOS devices only
    if (Platform.OS !== 'ios') {
      return false;
    }
    
    // Try to initialize HealthKit to see if it's really available
    return await this.initialize();
  }

  // Initialize HealthKit
  static async initialize(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }

    if (this.isInitialized) {
      return true;
    }

    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(PERMISSIONS, (error: string) => {
        if (error) {
          console.error('Error initializing HealthKit:', error);
          this.isInitialized = false;
          resolve(false);
          return;
        }
        
        this.isInitialized = true;
        resolve(true);
      });
    });
  }

  // Request permissions for Health data
  static async requestPermissions(): Promise<boolean> {
    if (!await this.isAvailable()) {
      return false;
    }
    
    // Permission is already requested during initialization
    return this.isInitialized;
  }

  // Generate health accomplishments from real HealthKit data
  static async generateAccomplishments(): Promise<string[]> {
    if (!await this.isAvailable()) {
      return this.generateMockAccomplishments();
    }
    
    try {
      const options = {
        date: new Date().toISOString(),
      };
      
      // Get steps data
      const stepsData = await new Promise<HealthValue>((resolve, reject) => {
        AppleHealthKit.getStepCount(options, (err: string, results: HealthValue) => {
          if (err) {
            console.log('Error getting steps:', err);
            resolve({ value: 0 });
            return;
          }
          resolve(results);
        });
      });
      
      // Get distance data
      const distanceData = await new Promise<HealthValue>((resolve, reject) => {
        AppleHealthKit.getDistanceWalking(options, (err: string, results: HealthValue) => {
          if (err) {
            console.log('Error getting distance:', err);
            resolve({ value: 0 });
            return;
          }
          resolve(results);
        });
      });
      
      // Get calories data
      const caloriesData = await new Promise<HealthValue>((resolve, reject) => {
        AppleHealthKit.getActiveEnergyBurned(options, (err: string, results: HealthValue) => {
          if (err) {
            console.log('Error getting calories:', err);
            resolve({ value: 0 });
            return;
          }
          resolve(results);
        });
      });
      
      const steps = stepsData?.value || 0;
      const distance = (distanceData?.value || 0).toFixed(2);
      const calories = Math.round(caloriesData?.value || 0);
      
      const accomplishments = [];
      
      if (steps > 0) {
        accomplishments.push(`Walked ${steps.toLocaleString()} steps today`);
      }
      
      if (parseFloat(distance) > 0) {
        accomplishments.push(`Walked ${distance} km today`);
      }
      
      if (calories > 0) {
        accomplishments.push(`Burned ${calories} active calories`);
      }
      
      // If no data, return mock data
      if (accomplishments.length === 0) {
        return this.generateMockAccomplishments();
      }
      
      return accomplishments;
    } catch (error) {
      console.error('Error getting health data:', error);
      return this.generateMockAccomplishments();
    }
  }
  
  // Generate mock data when HealthKit is not available
  private static generateMockAccomplishments(): string[] {
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
