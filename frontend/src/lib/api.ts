import axios from 'axios';
import type {
  UserSummary,
  UserData,
  AnalysisResult,
  PostGenerationResult,
  PostGenerationRequest,
  PromptGenerationRequest,
  PromptGenerationResult,
  TweakRequest,
  TweakResult,
  Community,
  DataStats
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3002',
  timeout: 120000, // 2 minutes for long operations
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
);

export const apiService = {
  // Health check
  async health() {
    const response = await api.get('/health');
    return response.data;
  },

  // User management
  async getUsers(): Promise<UserSummary[]> {
    const response = await api.get('/api/users');
    return response.data;
  },

  async getUser(username: string): Promise<UserData> {
    const response = await api.get(`/api/users/${username}`);
    return response.data;
  },

  async deleteUser(username: string): Promise<{ message: string }> {
    const response = await api.delete(`/api/users/${username}`);
    return response.data;
  },

  // Twitter scraping
  async scrapePosts(username: string): Promise<{ username: string; postsCount: number; posts: any[] }> {
    const response = await api.post(`/api/scrape/${username}`);
    return response.data;
  },

  async refreshPosts(username: string): Promise<{ username: string; postsCount: number; posts: any[] }> {
    const response = await api.post(`/api/scrape/${username}/refresh`);
    return response.data;
  },

  // Analysis
  async analyzeUser(username: string): Promise<AnalysisResult> {
    const response = await api.post(`/api/analyze/${username}`);
    return response.data;
  },

  async getAnalysis(username: string): Promise<AnalysisResult> {
    const response = await api.get(`/api/analysis/${username}`);
    return response.data;
  },

  // Post generation
  async generatePosts(username: string, request: PostGenerationRequest = {}): Promise<PostGenerationResult> {
    const response = await api.post(`/api/generate/${username}`, request);
    return response.data;
  },

  // Prompt-based generation
  async generateFromPrompt(request: PromptGenerationRequest): Promise<PromptGenerationResult> {
    const response = await api.post('/api/generate/prompt', request);
    return response.data;
  },

  // Tweak post ideas
  async tweakPostIdea(request: TweakRequest): Promise<TweakResult> {
    const response = await api.post('/api/tweak', request);
    return response.data;
  },

  // Settings
  async getSettings(username: string): Promise<{ username: string; customInstructions?: string; availableCommunities: Community[] }> {
    const response = await api.get(`/api/settings/${username}`);
    return response.data;
  },

  async updateInstructions(username: string, instructions: string): Promise<{ message: string; instructions: string }> {
    const response = await api.put(`/api/settings/${username}/instructions`, { instructions });
    return response.data;
  },

  async addCommunity(username: string, community: Community): Promise<{ message: string; communities: Community[] }> {
    const response = await api.post(`/api/settings/${username}/communities`, community);
    return response.data;
  },

  async deleteCommunity(username: string, communityName: string): Promise<{ message: string; communities: Community[] }> {
    const response = await api.delete(`/api/settings/${username}/communities/${encodeURIComponent(communityName)}`);
    return response.data;
  },

  // Data management
  async getDataStats(): Promise<DataStats> {
    const response = await api.get('/api/data/stats');
    return response.data;
  },

  async exportUserData(username: string, format: 'json' | 'csv' = 'json'): Promise<{ message: string; filePath: string; format: string }> {
    const response = await api.post(`/api/export/${username}`, { format });
    return response.data;
  },

  // Auth status
  async getAuthStatus(): Promise<{ authenticated: boolean; credentials: boolean }> {
    const response = await api.get('/api/auth/status');
    return response.data;
  },
};

export default apiService;
