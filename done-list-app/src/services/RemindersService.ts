import { Platform } from 'react-native';
import RNReminders from '@wiicamp/react-native-reminders';

interface ReminderType {
  id: string;
  title: string;
  dueDate?: string;
  notes?: string;
  priority?: number;
  list?: string;
  completed?: boolean;
  completionDate?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  notes?: string;
  completed?: boolean;
}

interface ReminderUpdate {
  title: string;
  dueDate?: Date;
  notes?: string;
}

export class RemindersService {
  private static instance: RemindersService;
  private isInitialized: boolean = false;
  private authStatus: string = 'notDetermined';

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
        // Request authorization for reminders
        const status = await (RNReminders as any).requestPermission();
        this.authStatus = status;
        
        if (status !== 'authorized') {
          console.error('Reminders permission not granted. Status:', status);
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

  async getReminders(): Promise<ReminderType[]> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('RemindersService not initialized');
      }
    }

    try {
      // Get reminders with proper error handling
      const reminders = await (RNReminders as any).getReminders({
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        completed: true
      });
      
      return reminders.map((reminder: any) => ({
        id: reminder.id,
        title: reminder.title,
        dueDate: reminder.dueDate,
        notes: reminder.notes,
        priority: reminder.priority,
        list: reminder.list,
        completed: reminder.completed,
        completionDate: reminder.completionDate
      }));
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
      const reminderId = await (RNReminders as any).createReminder({
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

  async updateReminder(id: string, updates: ReminderUpdate): Promise<void> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('RemindersService not initialized');
      }
    }

    try {
      await (RNReminders as any).updateReminder({
        id,
        title: updates.title,
        dueDate: updates.dueDate?.toISOString(),
        priority: 0,
        notes: updates.notes || '',
        list: 'Default'
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
      await (RNReminders as any).deleteReminder(id);
    } catch (error) {
      console.error('Failed to delete reminder:', error);
      throw error;
    }
  }

  getAuthorizationStatus(): string {
    return this.authStatus;
  }
} 