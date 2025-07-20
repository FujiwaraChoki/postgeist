export interface Analysis {
  summary: string;
  key_themes: string[];
  engagement_patterns: string[];
  unique_behaviors: string[];
  opportunities: string[];
  tone: string;
}

export interface Community {
  name: string;
  description: string;
}

export interface PostIdea {
  text: string;
  community: string | null;
  reasoning?: string;
}

export interface UserData {
  username: string;
  posts: TwitterPost[];
  analysis?: Analysis;
  customInstructions?: string;
  availableCommunities?: Community[];
  randomFacts?: string[];
  lastUpdated: string;
}

export interface TwitterPost {
  text: string;
  photos?: Array<{ url: string }>;
  videos?: Array<{ url: string }>;
  [key: string]: any;
}

export interface AppConfig {
  dataDir: string;
  logLevel: string;
  maxPostsToAnalyze: number;
  maxPostsForPrompt: number;
}

export interface ScraperConfig {
  username?: string;
  password?: string;
  email?: string;
}

export type ActionType = 'analyze' | 'ideas' | 'both' | 'info' | 'settings' | 'data' | 'exit';
export type SettingsActionType = 'instructions' | 'communities' | 'facts' | 'back';
export type CommunityActionType = 'view' | 'add' | 'remove' | 'back';
export type InstructionsActionType = 'view' | 'edit' | 'clear' | 'back';
export type FactsActionType = 'view' | 'add' | 'remove' | 'clear' | 'back';
