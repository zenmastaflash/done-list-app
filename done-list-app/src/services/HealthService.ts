import { Platform } from 'react-native';
import AppleHealthKit, {
  HealthInputOptions,
  HealthKitPermissions,
} from 'react-native-health';
import {
  initialize,
  requestPermission,
  readRecords,
  Permission,
} from 'react-native-health-connect';

const IOS_PERMS = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.StepCount,
      AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
    ],
    write: [],
  },
} as HealthKitPermissions;

const ANDROID_PERMS: Permission[] = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'Distance' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' }
];

export class HealthService {
  private static instance: HealthService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): HealthService {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService();
    }
    return HealthService.instance;
  }

  async isAvailable(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      return true;
    } else if (Platform.OS === 'android') {
      try {
        return await initialize();
      } catch (error) {
        console.error('[ERROR] Health Connect not available:', error);
        return false;
      }
    }
    return false;
  }

  async requestPermissions(): Promise<boolean> {
    if (!await this.isAvailable()) return false;
    
    if (Platform.OS === 'ios') {
      return new Promise((resolve) => {
        AppleHealthKit.initHealthKit(IOS_PERMS, (error: string) => {
          if (error) {
            console.log('[ERROR] Cannot grant HealthKit permissions');
            resolve(false);
          }
          this.initialized = true;
          resolve(true);
        });
      });
    } else if (Platform.OS === 'android') {
      try {
        const permissions = await requestPermission(ANDROID_PERMS);
        this.initialized = permissions.length > 0;
        return this.initialized;
      } catch (error) {
        console.error('[ERROR] Cannot grant Health Connect permissions:', error);
        return false;
      }
    }
    return false;
  }

  private async getStepsToday(): Promise<number> {
    if (!this.initialized) return 0;

    if (Platform.OS === 'ios') {
      const options = {
        date: new Date().toISOString(),
      } as HealthInputOptions;

      return new Promise((resolve) => {
        AppleHealthKit.getStepCount(
          options,
          (err: string, results: any) => {
            if (err) {
              console.log('[ERROR] Cannot get steps:', err);
              resolve(0);
            }
            const totalSteps = Array.isArray(results) 
              ? results.reduce((sum, item) => sum + (item.value || 0), 0)
              : results.value || 0;
            resolve(totalSteps);
          }
        );
      });
    } else if (Platform.OS === 'android') {
      try {
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        
        const response = await readRecords('Steps', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startOfDay.toISOString(),
            endTime: today.toISOString()
          }
        });
        
        if (response.records && response.records.length > 0) {
          return (response.records[0] as any).count;
        }
      } catch (error) {
        console.error('[ERROR] Cannot get steps:', error);
      }
    }
    return 0;
  }

  private async getDistanceToday(): Promise<number> {
    if (!this.initialized) return 0;

    if (Platform.OS === 'ios') {
      const options = {
        date: new Date().toISOString(),
        unit: 'mile',
      } as HealthInputOptions;

      return new Promise((resolve) => {
        AppleHealthKit.getDistanceWalkingRunning(
          options,
          (err: string, results: any) => {
            if (err) {
              console.log('[ERROR] Cannot get distance:', err);
              resolve(0);
            }
            const totalDistance = Array.isArray(results)
              ? results.reduce((sum, item) => sum + (item.value || 0), 0)
              : results.value || 0;
            resolve(totalDistance);
          }
        );
      });
    } else if (Platform.OS === 'android') {
      try {
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        
        const response = await readRecords('Distance', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startOfDay.toISOString(),
            endTime: today.toISOString()
          }
        });
        
        if (response.records && response.records.length > 0) {
          return ((response.records[0] as any).distance / 1000); // Convert to km
        }
      } catch (error) {
        console.error('[ERROR] Cannot get distance:', error);
      }
    }
    return 0;
  }

  private async getActiveCaloriesToday(): Promise<number> {
    if (!this.initialized) return 0;

    if (Platform.OS === 'ios') {
      const options = {
        date: new Date().toISOString(),
      } as HealthInputOptions;

      return new Promise((resolve) => {
        AppleHealthKit.getActiveEnergyBurned(
          options,
          (err: string, results: any) => {
            if (err) {
              console.log('[ERROR] Cannot get calories:', err);
              resolve(0);
            }
            const totalCalories = Array.isArray(results)
              ? results.reduce((sum, item) => sum + (item.value || 0), 0)
              : results.value || 0;
            resolve(totalCalories);
          }
        );
      });
    } else if (Platform.OS === 'android') {
      try {
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        
        const response = await readRecords('ActiveCaloriesBurned', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startOfDay.toISOString(),
            endTime: today.toISOString()
          }
        });
        
        if (response.records && response.records.length > 0) {
          return Math.round((response.records[0] as any).energy.inKilocalories);
        }
      } catch (error) {
        console.error('[ERROR] Cannot get calories:', error);
      }
    }
    return 0;
  }

  async generateAccomplishments(): Promise<string[]> {
    if (!await this.isAvailable() || !this.initialized) {
      return [];
    }

    const accomplishments: string[] = [];
    
    try {
      const steps = await this.getStepsToday();
      if (steps > 0) {
        accomplishments.push(`Walked ${steps.toLocaleString()} steps today`);
      }

      const distance = await this.getDistanceToday();
      if (distance > 0) {
        const unit = Platform.OS === 'ios' ? 'miles' : 'km';
        accomplishments.push(`Walked ${distance.toFixed(1)} ${unit} today`);
      }

      const calories = await this.getActiveCaloriesToday();
      if (calories > 0) {
        accomplishments.push(`Burned ${calories.toFixed(0)} active calories today`);
      }
    } catch (error) {
      console.error('[ERROR] Failed to generate health accomplishments:', error);
    }

    return accomplishments;
  }
}
