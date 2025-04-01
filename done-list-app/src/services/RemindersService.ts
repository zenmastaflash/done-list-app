import { Platform } from 'react-native';
import RNReminders from '@wiicamp/react-native-reminders';

export class RemindersService {
  private static instance: RemindersService;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): RemindersService {
    if (!RemindersService.instance) {
      RemindersService.instance = new RemindersService();
    }
    return RemindersService.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      if (Platform.OS === 'ios') {
        const authStatus = await RNReminders.requestPermission();
        if (!authStatus) {
          console.error('Reminders permission not granted');
          return false;
        }
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize RemindersService:', error);
      return false;
    }
  }

  async getReminders(): Promise<any[]> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('RemindersService not initialized');
      }
    }

    try {
      const reminders = await RNReminders.getReminders();
      return reminders;
    } catch (error) {
      console.error('Failed to get reminders:', error);
      throw error;
    }
  }

  async createReminder(title: string, dueDate?: Date): Promise<string> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('RemindersService not initialized');
      }
    }

    try {
      const reminderId = await RNReminders.createReminder({
        title,
        dueDate: dueDate?.toISOString(),
        priority: 0,
        notes: '',
        list: 'Default'
      });
      return reminderId;
    } catch (error) {
      console.error('Failed to create reminder:', error);
      throw error;
    }
  }

  async updateReminder(id: string, updates: any): Promise<void> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('RemindersService not initialized');
      }
    }

    try {
      await RNReminders.updateReminder({
        id,
        title: updates.title,
        dueDate: updates.dueDate?.toISOString(),
        priority: updates.priority || 0,
        notes: updates.notes || '',
        list: updates.list || 'Default'
      });
    } catch (error) {
      console.error('Failed to update reminder:', error);
      throw error;
    }
  }

  async deleteReminder(id: string): Promise<void> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('RemindersService not initialized');
      }
    }

    try {
      await RNReminders.deleteReminder(id);
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      throw error;
    }
  }
} 