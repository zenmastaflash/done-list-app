import { Platform } from 'react-native';
import AppleHealthKit, {
  HealthKitPermissions,
  HealthValue,
} from 'react-native-health';

// Define the permissions your app will request
const PERMISSIONS = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.StepCount,
      AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      AppleHealthKit.Constants.Permissions.AppleExerciseTime,
      AppleHealthKit.Constants.Permissions.FlightsClimbed,
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
      console.log('HealthKit not available: Not iOS device');
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
      console.log('HealthKit already initialized');
      return true;
    }

    console.log('Initializing HealthKit...');
    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(PERMISSIONS, (error: string) => {
        if (error) {
          console.error('Error initializing HealthKit:', error);
          this.isInitialized = false;
          resolve(false);
          return;
        }
        
        console.log('HealthKit initialized successfully');
        this.isInitialized = true;
        resolve(true);
      });
    });
  }

  // Request permissions for Health data
  static async requestPermissions(): Promise<boolean> {
    console.log('Requesting HealthKit permissions...');
    if (!await this.isAvailable()) {
      console.log('HealthKit not available for permissions request');
      return false;
    }
    
    // Permission is already requested during initialization
    console.log('HealthKit permissions status:', this.isInitialized);
    return this.isInitialized;
  }

  // Generate health accomplishments from real HealthKit data
  static async generateAccomplishments(): Promise<string[]> {
    console.log('Generating health accomplishments...');
    if (!await this.isAvailable()) {
      console.log('HealthKit not available');
      return [];
    }
    
    try {
      const options = {
        date: new Date().toISOString(),
      };
      
      console.log('Fetching health data with options:', options);
      
      // Get steps data
      const steps = await new Promise<number>((resolve, reject) => {
        AppleHealthKit.getStepCount(options, (err: string, results: { value: number }) => {
          if (err) {
            console.error('Error getting steps:', err);
            reject(err);
            return;
          }
          console.log('Steps fetched:', results.value);
          resolve(results.value);
        });
      });

      // Get active energy burned
      const activeEnergy = await new Promise<number>((resolve, reject) => {
        AppleHealthKit.getActiveEnergyBurned(options, (err: string, results: HealthValue[]) => {
          if (err) {
            console.error('Error getting active energy:', err);
            reject(err);
            return;
          }
          console.log('Active energy fetched:', results[0]?.value);
          resolve(results[0]?.value || 0);
        });
      });

      // Get exercise time
      const exerciseTime = await new Promise<number>((resolve, reject) => {
        AppleHealthKit.getAppleExerciseTime(options, (err: string, results: HealthValue[]) => {
          if (err) {
            console.error('Error getting exercise time:', err);
            reject(err);
            return;
          }
          console.log('Exercise time fetched:', results[0]?.value);
          resolve(results[0]?.value || 0);
        });
      });

      // Get flights climbed
      const flightsClimbed = await new Promise<number>((resolve, reject) => {
        AppleHealthKit.getFlightsClimbed(options, (err: string, results: { value: number }) => {
          if (err) {
            console.error('Error getting flights climbed:', err);
            reject(err);
            return;
          }
          console.log('Flights climbed fetched:', results.value);
          resolve(results.value);
        });
      });

      const accomplishments: string[] = [];
      
      if (steps > 0) {
        accomplishments.push(`Walked ${steps} steps today`);
      }
      
      if (activeEnergy > 0) {
        accomplishments.push(`Burned ${Math.round(activeEnergy)} calories through activity`);
      }
      
      if (exerciseTime > 0) {
        const minutes = Math.round(exerciseTime / 60);
        accomplishments.push(`Exercised for ${minutes} minutes today`);
      }
      
      if (flightsClimbed > 0) {
        accomplishments.push(`Climbed ${flightsClimbed} flights of stairs today`);
      }

      console.log('Generated health accomplishments:', accomplishments);
      return accomplishments;
    } catch (error) {
      console.error('Error generating health accomplishments:', error);
      return [];
    }
  }

  // Remove mock data generation
  private static generateMockAccomplishments(): string[] {
    return [];
  }
}
