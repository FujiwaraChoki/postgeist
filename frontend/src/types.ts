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
  content_taxonomy?: string[];
  thematic_analysis?: string[];
  linguistic_patterns?: string[];
  engagement_mechanics?: string[];
  temporal_patterns?: string[];
  interaction_style?: string[];
  expertise_demonstration?: string[];
  content_evolution?: string[];
  untapped_opportunities?: string[];
  voice_architecture?: string;
}

export interface UserData {
  username: string;
  posts: TwitterPost[];
  analysis?: Analysis;
  customInstructions?: string;
  availableCommunities?: Community[];
  lastUpdated: string;
}

export interface UserSummary {
  username: string;
  postsCount: number;
  hasAnalysis: boolean;
  lastUpdated: string;
  customInstructions: boolean;
  communities: number;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PostGenerationRequest {
  count?: number;
  customInstructions?: string;
}

export interface AnalysisResult {
  username: string;
  analysis: Analysis;
  postsAnalyzed: number;
}

export interface PostGenerationResult {
  username: string;
  count: number;
  ideas: PostIdea[];
}

export interface PromptGenerationRequest {
  prompt: string;
  count?: number;
  username?: string;
}

export interface PromptGenerationResult {
  prompt: string;
  count: number;
  ideas: PostIdea[];
  username?: string;
}

export interface TweakRequest {
  originalText: string;
  feedback: string;
  username?: string;
}

export interface TweakResult {
  originalText: string;
  feedback: string;
  variations: PostIdea[];
  username?: string;
}

export interface DataStats {
  totalUsers: number;
  totalDataSize: string;
  lastUpdated?: string;
}
