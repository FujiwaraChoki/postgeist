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
}

export interface AnalysisResult {
  username: string;
  analysis: Analysis;
  postsAnalyzed: number;
}

export interface PostGenerationResult {
  username: string;
  postIdeas: PostIdea[];
  count: number;
}

export interface DataStats {
  totalUsers: number;
  totalDataSize: string;
  lastUpdated?: string;
}
