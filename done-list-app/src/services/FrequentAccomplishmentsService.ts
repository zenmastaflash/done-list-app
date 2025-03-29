import { supabase } from '../lib/supabase';
import { Accomplishment } from '../types/accomplishment';

export class FrequentAccomplishmentsService {
  private static instance: FrequentAccomplishmentsService;
  private static readonly FREQUENCY_THRESHOLD = 5; // Minimum number of occurrences

  private constructor() {}

  static getInstance(): FrequentAccomplishmentsService {
    if (!FrequentAccomplishmentsService.instance) {
      FrequentAccomplishmentsService.instance = new FrequentAccomplishmentsService();
    }
    return FrequentAccomplishmentsService.instance;
  }

  async getFrequentAccomplishments(): Promise<string[]> {
    try {
      const userResponse = await supabase.auth.getUser();
      
      if (!userResponse.data.user) {
        throw new Error('User not authenticated');
      }
      
      const userId = userResponse.data.user.id;
      
      const { data, error } = await supabase
        .from('accomplishments')
        .select('description, type')
        .eq('user_id', userId)
        .neq('type', 'questionnaire')  // Filter out questionnaire items
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching frequent accomplishments:', error);
        throw error;
      }

      // Count occurrences of each description
      const descriptionCounts = data.reduce((acc: { [key: string]: number }, curr) => {
        acc[curr.description] = (acc[curr.description] || 0) + 1;
        return acc;
      }, {});

      // Filter for accomplishments that meet the frequency threshold
      const frequentAccomplishments = Object.entries(descriptionCounts)
        .filter(([_, count]) => count >= FrequentAccomplishmentsService.FREQUENCY_THRESHOLD)
        .sort(([, a], [, b]) => b - a) // Sort by frequency
        .slice(0, 5) // Limit to top 5 most frequent
        .map(([description]) => description);

      return frequentAccomplishments;
    } catch (error) {
      console.error('Error getting frequent accomplishments:', error);
      return [];
    }
  }

  async addAccomplishment(description: string): Promise<void> {
    try {
      const userResponse = await supabase.auth.getUser();
      
      if (!userResponse.data.user) {
        throw new Error('User not authenticated');
      }
      
      const userId = userResponse.data.user.id;
      
      const { error } = await supabase
        .from('accomplishments')
        .insert([{
          description,
          type: 'manual',
          user_id: userId,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error adding accomplishment:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error adding accomplishment:', error);
      throw error;
    }
  }
} 