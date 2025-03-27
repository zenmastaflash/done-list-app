import { TodoistApi } from '@doist/todoist-api-typescript';

export class TodoistService {
  private static api: TodoistApi | null = null;
  private static token: string | null = null;

  // Initialize with API token
  static initialize(apiToken: string): boolean {
    try {
      this.token = apiToken;
      this.api = new TodoistApi(apiToken);
      return true;
    } catch (error) {
      console.error('Failed to initialize Todoist:', error);
      return false;
    }
  }

  // Check if service is initialized
  static isInitialized(): boolean {
    return !!this.api && !!this.token;
  }

  // Get API token
  static getToken(): string | null {
    return this.token;
  }

  // Get completed tasks for today
  static async getCompletedToday(): Promise<string[]> {
    if (!this.api) {
      throw new Error('Todoist API not initialized');
    }
    
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const completedTasks = await this.api.getCompletedTasks({
        since: yesterday.toISOString(),
      });
      
      // Filter for tasks completed today
      const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const todayTasks = completedTasks.items.filter(task => {
        return task.completedAt && task.completedAt >= todayStart;
      });
      
      // Extract task names
      return todayTasks.map(task => task.content);
    } catch (error) {
      console.error('Error fetching completed Todoist tasks:', error);
      return [];
    }
  }

  // Get active projects
  static async getProjects(): Promise<any[]> {
    if (!this.api) {
      throw new Error('Todoist API not initialized');
    }
    
    try {
      return await this.api.getProjects();
    } catch (error) {
      console.error('Error fetching Todoist projects:', error);
      return [];
    }
  }

  // Get all tasks
  static async getTasks(): Promise<any[]> {
    if (!this.api) {
      throw new Error('Todoist API not initialized');
    }
    
    try {
      return await this.api.getTasks();
    } catch (error) {
      console.error('Error fetching Todoist tasks:', error);
      return [];
    }
  }
}
