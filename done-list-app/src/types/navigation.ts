import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  Questionnaire: undefined;
  Settings: undefined;
  Todoist: undefined;
  Reminders: undefined;
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>; 