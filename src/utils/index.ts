import * as clack from "@clack/prompts";
import chalk from "chalk";
import type { UserData, PostIdea } from "../types";

export class Utils {
  /**
   * Copy text to clipboard (if available)
   */
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      // For now, we'll just show the text
      // In the future, we could integrate with clipboard libraries
      console.log(chalk.dim("\n📋 Text ready to copy:"));
      console.log(chalk.blue(text));
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Format timestamp for display
   */
  static formatDate(timestamp: string): string {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return "Unknown";
    }
  }

  /**
   * Format byte size for display
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Validate environment setup
   */
  static validateEnvironment(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check for required environment variables
    if (!process.env.TWITTER_USERNAME) {
      issues.push("TWITTER_USERNAME environment variable is missing");
    }
    if (!process.env.TWITTER_PASSWORD) {
      issues.push("TWITTER_PASSWORD environment variable is missing");
    }

    // Check for optional but recommended variables
    if (!process.env.TWITTER_EMAIL) {
      issues.push("TWITTER_EMAIL environment variable is missing (recommended)");
    }

    return {
      valid: issues.filter(issue => !issue.includes("recommended")).length === 0,
      issues
    };
  }

  /**
   * Sanitize filename for safe file operations
   */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-z0-9_\-\.]/gi, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  }

  /**
   * Get unique communities from user data
   */
  static getUniqueCommunities(users: UserData[]): string[] {
    const communities = new Set<string>();

    users.forEach(user => {
      user.availableCommunities?.forEach(community => {
        communities.add(community.name);
      });
    });

    return Array.from(communities).sort();
  }

  /**
   * Calculate statistics for user data
   */
  static generateUserDataStats(userData: UserData): UserDataStats {
    return {
      totalPosts: userData.posts.length,
      hasAnalysis: !!userData.analysis,
      hasCustomInstructions: !!userData.customInstructions,
      communitiesCount: userData.availableCommunities?.length || 0,
      hasRandomFacts: !!(userData.analysis?.randomFacts && userData.analysis.randomFacts.length > 0),
      randomFactsCount: userData.analysis?.randomFacts?.length || 0,
    };
  }

  /**
   * Extract hashtags from text
   */
  static extractHashtags(text: string): string[] {
    const hashtagRegex = /#[\w]+/g;
    return text.match(hashtagRegex) || [];
  }

  /**
   * Extract mentions from text
   */
  static extractMentions(text: string): string[] {
    const mentionRegex = /@[\w]+/g;
    return text.match(mentionRegex) || [];
  }

  /**
   * Count words in text
   */
  static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Truncate text with ellipsis
   */
  static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Group post ideas by community
   */
  static groupPostIdeasByCommunity(postIdeas: PostIdea[]): Map<string, PostIdea[]> {
    const grouped = new Map<string, PostIdea[]>();

    postIdeas.forEach(idea => {
      const community = idea.community || 'No Community';
      if (!grouped.has(community)) {
        grouped.set(community, []);
      }
      grouped.get(community)!.push(idea);
    });

    return grouped;
  }

  /**
   * Generate summary statistics for post ideas
   */
  static generatePostIdeasStats(postIdeas: PostIdea[]): {
    total: number;
    withCommunity: number;
    withoutCommunity: number;
    averageLength: number;
    communities: string[];
  } {
    const withCommunity = postIdeas.filter(idea => idea.community).length;
    const totalLength = postIdeas.reduce((sum, idea) => sum + idea.text.length, 0);
    const communities = [...new Set(postIdeas.filter(idea => idea.community).map(idea => idea.community!))];

    return {
      total: postIdeas.length,
      withCommunity,
      withoutCommunity: postIdeas.length - withCommunity,
      averageLength: Math.round(totalLength / postIdeas.length),
      communities: communities.sort()
    };
  }

  /**
   * Handle errors gracefully with user-friendly messages
   */
  static handleError(error: unknown, context: string = ""): void {
    let message = "An unexpected error occurred";

    if (error instanceof Error) {
      if (error.message.includes('credentials')) {
        message = "Twitter authentication failed. Please check your credentials.";
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        message = "Network error. Please check your connection and try again.";
      } else if (error.message.includes('rate limit')) {
        message = "Rate limit exceeded. Please wait before trying again.";
      } else if (error.message.includes('not found')) {
        message = "User not found. Please check the username and try again.";
      } else {
        message = error.message;
      }
    }

    if (context) {
      message = `${context}: ${message}`;
    }

    clack.log.error(chalk.red(message));
  }

  /**
   * Show progress for long operations
   */
  static async withProgress<T>(
    promise: Promise<T>,
    startMessage: string,
    successMessage?: string,
    errorMessage?: string
  ): Promise<T> {
    const spinner = clack.spinner();
    spinner.start(startMessage);

    try {
      const result = await promise;
      spinner.stop(successMessage || "✅ Completed!");
      return result;
    } catch (error) {
      spinner.stop(errorMessage || "❌ Failed!");
      throw error;
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  static async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          throw lastError;
        }

        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Deep clone object
   */
  static deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Check if string is valid JSON
   */
  static isValidJSON(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }
}
