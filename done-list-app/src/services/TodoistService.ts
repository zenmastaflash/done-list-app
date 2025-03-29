import { TodoistApi, Task, Project } from '@doist/todoist-api-typescript';
import { supabase } from '../lib/supabase';
import { Accomplishment } from '../types/accomplishment';

interface TodoistTask {
  id: string;
  content: string;
  isCompleted: boolean;
}

interface CompletedTask {
  id: string;
  content: string;
  completedAt: string;
}

interface CompletedTasksResponse {
  items: CompletedTask[];
}

export class TodoistService {
  private static instance: TodoistService | null = null;
  private api: TodoistApi | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): TodoistService {
    if (!TodoistService.instance) {
      TodoistService.instance = new TodoistService();
    }
    return TodoistService.instance;
  }

  async initialize(token: string): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      this.api = new TodoistApi(token);
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize TodoistService:', error);
      return false;
    }
  }

  async getCompletedTasks(): Promise<Accomplishment[]> {
    if (!this.api) {
      throw new Error('TodoistService not initialized');
    }

    try {
      // Get all tasks and filter completed ones
      const allTasks = await this.api.getTasks();
      const completedTasks = allTasks.filter((task: Task) => task.isCompleted);
      
      return completedTasks.map((task: Task) => ({
        id: task.id,
        description: task.content,
        type: 'todoist' as const,
        created_at: task.createdAt || new Date().toISOString(),
        user_id: '', // Will be set when saving to Supabase
      }));
    } catch (error) {
      console.error('Failed to get completed tasks:', error);
      throw error;
    }
  }

  async saveCompletedTasksAsAccomplishments(): Promise<void> {
    try {
      const userResponse = await supabase.auth.getUser();
      
      if (!userResponse.data.user) {
        throw new Error('User not authenticated');
      }
      
      const userId = userResponse.data.user.id;
      const completedTasks = await this.getCompletedTasks();
      
      const accomplishments = completedTasks.map(task => ({
        ...task,
        user_id: userId,
      }));

      const { error } = await supabase
        .from('accomplishments')
        .insert(accomplishments);

      if (error) {
        console.error('Error saving Todoist tasks:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error saving Todoist tasks:', error);
      throw error;
    }
  }

  // Get completed tasks for today
  static async getCompletedToday(): Promise<string[]> {
    const instance = TodoistService.getInstance();
    if (!instance.api) {
      throw new Error('Todoist API not initialized');
    }
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const allTasks = await instance.api.getTasks();
      const todayTasks = allTasks.filter((task: Task) => {
        return task.isCompleted && task.createdAt && new Date(task.createdAt) >= today;
      });
      
      return todayTasks.map(task => task.content);
    } catch (error) {
      console.error('Error fetching completed Todoist tasks:', error);
      return [];
    }
  }

  // Get active projects
  static async getProjects(): Promise<Project[]> {
    const instance = TodoistService.getInstance();
    if (!instance.api) {
      throw new Error('Todoist API not initialized');
    }
    
    try {
      const response = await instance.api.getProjects();
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching Todoist projects:', error);
      return [];
    }
  }

  // Get all tasks
  static async getTasks(): Promise<Task[]> {
    const instance = TodoistService.getInstance();
    if (!instance.api) {
      throw new Error('Todoist API not initialized');
    }
    
    try {
      const response = await instance.api.getTasks();
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching Todoist tasks:', error);
      return [];
    }
  }
}
