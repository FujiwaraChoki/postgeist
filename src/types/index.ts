export interface TwitterPost {
  text: string;
  photos?: { url: string }[];
  videos?: { url: string }[];
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

export interface Analysis {
  summary: string;
  key_themes: string[];
  engagement_patterns: string[];
  unique_behaviors: string[];
  opportunities: string[];
  tone: string;
  randomFacts: string[];
}

export interface UserData {
  username: string;
  posts: TwitterPost[];
  analysis?: Analysis;
  customInstructions?: string;
  availableCommunities?: Community[];
  lastUpdated: string;
}

// Action types
export type ActionType = 'analyze' | 'ideas' | 'both' | 'info' | 'settings' | 'data' | 'exit';

export type SettingsActionType = 'instructions' | 'communities' | 'facts' | 'back';

export type CommunityActionType = 'view' | 'add' | 'remove' | 'back';

export type InstructionsActionType = 'view' | 'edit' | 'clear' | 'back';

export type FactsActionType = 'view' | 'regenerate' | 'back';
