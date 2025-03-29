export interface Accomplishment {
  id: string;
  description: string;
  type: 'health' | 'todoist' | 'reminders' | 'manual' | 'questionnaire';
  created_at: string;
  user_id: string;
} 