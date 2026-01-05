
export interface Fact {
  id: string;
  topic: string;
  content: string;
  sourceName: string;
  sourceUrl: string;
  liked: boolean;
  saved: boolean;
  xpEarned: boolean;
  deckId?: string;
  isAd?: boolean; 
}

export interface Deck {
  id: string;
  name: string;
  color: string;
}

export interface Reply {
  id: string;
  username: string;
  text: string;
  timestamp: number;
}

export interface Feedback {
  id: string;
  username: string;
  type: 'feature' | 'bug' | 'content';
  text: string;
  likes: number;
  replies: Reply[];
  timestamp: number;
}

export interface UserProfile {
  // Auth
  email?: string;
  password?: string;
  isAuthenticated: boolean;

  username: string;
  bio: string;
  pfpUrl: string;
  level: number;
  xp: number;
  nextLevelXp: number;
  
  // Streaks & Daily Goals
  streak: number;
  lastGoalDate: string; // ISO Date string of last time daily goal was hit
  dailyGoal: number;
  dailyXp: number;
  lastActiveDate: string; // ISO Date string for checking missed days

  isCurated: boolean;
  onboardingComplete: boolean; // For the interactive tutorial
  badges: Badge[];
  interests: string[];
  // The Algorithm
  topicWeights: Record<string, number>;
  dislikedTopics: string[];
  decks: Deck[];
}

export interface Badge {
  type: 'easy' | 'medium' | 'hard';
  count: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export type AppTheme = 'light' | 'dark';
export type AppView = 'auth' | 'setup' | 'feed' | 'explore' | 'quiz' | 'saved' | 'profile' | 'feedback' | 'generate';
