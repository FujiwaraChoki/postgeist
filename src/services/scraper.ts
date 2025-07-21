import { Scraper } from "@the-convocation/twitter-scraper";
import type { TwitterPost, UserData } from "../types";
import { config } from "../config";
import { createLogger } from "../../logger";
import { dataService } from "./data";

const logger = createLogger("ScraperService");

export class ScraperService {
  private scraper: Scraper | null = null;
  private isAuthenticated = false;

  async validateCredentials(): Promise<{ valid: boolean; missing: string[] }> {
    const missing = config.getMissingCredentials();
    return {
      valid: missing.length === 0,
      missing
    };
  }

  async fetchPosts(username: string): Promise<TwitterPost[]> {
    try {
      // Check if we have cached posts first
      const userData = await dataService.getUserData(username);
      if (userData.posts && userData.posts.length > 0) {
        logger.info(`Using ${userData.posts.length} cached posts for @${username}`);
        return userData.posts;
      }

      // Validate credentials before attempting to scrape
      const { valid, missing } = await this.validateCredentials();
      if (!valid) {
        throw new Error(`Missing Twitter credentials: ${missing.join(', ')}. Please set these environment variables.`);
      }

      // Initialize scraper if needed
      if (!this.scraper) {
        this.scraper = new Scraper();

        // Authenticate with Twitter
        await this.scraper.login(
          config.scraper.username!,
          config.scraper.password!,
          config.scraper.email
        );
        this.isAuthenticated = true;
      }

      logger.info(`Fetching fresh posts for @${username}...`);

      // Fetch tweets
      const tweets = this.scraper.getTweets(username);
      const posts: TwitterPost[] = [];

      for await (const tweet of tweets) {
        posts.push(tweet as TwitterPost);

        // Limit based on configuration
        if (posts.length >= config.app.maxPostsToAnalyze) {
          break;
        }
      }

      logger.info(`Fetched ${posts.length} posts for @${username}`);

      // Save posts to user data
      userData.posts = posts;
      await dataService.saveUserData(userData);

      return posts;
    } catch (error) {
      logger.error(`Failed to fetch posts for @${username}`, error as Error);

      // Provide more helpful error messages
      if (error instanceof Error) {
        if (error.message.includes('Authorization')) {
          throw new Error('Twitter authentication failed. Please check your credentials and try again.');
        } else if (error.message.includes('Rate limit')) {
          throw new Error('Twitter rate limit exceeded. Please wait before trying again.');
        } else if (error.message.includes('User not found')) {
          throw new Error(`Twitter user @${username} not found. Please check the username and try again.`);
        }
      }

      throw error;
    }
  }

  async refreshPosts(username: string): Promise<TwitterPost[]> {
    // Clear cached data and fetch fresh posts
    const userData = await dataService.getUserData(username);
    userData.posts = [];
    await dataService.saveUserData(userData);

    return this.fetchPosts(username);
  }

  getAuthStatus(): { authenticated: boolean; credentials: boolean } {
    return {
      authenticated: this.isAuthenticated,
      credentials: config.validateTwitterCredentials()
    };
  }

  clearCache(): void {
    this.scraper = null;
    this.isAuthenticated = false;
    logger.info("Cleared scraper cache");
  }
}

export const scraperService = new ScraperService();
