import fs from "fs";
import path from "path";
import type { UserData, TwitterPost } from "../types";
import { config } from "../config";
import { createLogger } from "../../logger";

const logger = createLogger("DataService");

export class DataService {
  private dataDir: string;

  constructor() {
    this.dataDir = config.app.dataDir;
    this.ensureDataDirExists();
  }

  private ensureDataDirExists(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      logger.info(`Created data directory: ${this.dataDir}`);
    }
  }

  async getUserData(username: string): Promise<UserData> {
    const userFilePath = path.join(this.dataDir, `${username}.json`);
    const userFile = Bun.file(userFilePath);

    if (await userFile.exists()) {
      try {
        const data = JSON.parse(await userFile.text()) as UserData;
        logger.debug(`Loaded user data for @${username}`, { postsCount: data.posts.length });
        return data;
      } catch (error) {
        logger.warn(`Failed to parse user data for @${username}, creating new`, error as Error);
      }
    }

    const newUserData: UserData = {
      username,
      posts: [],
      lastUpdated: new Date().toISOString()
    };

    logger.info(`Created new user data for @${username}`);
    return newUserData;
  }

  async saveUserData(userData: UserData): Promise<void> {
    try {
      const userFilePath = path.join(this.dataDir, `${userData.username}.json`);
      userData.lastUpdated = new Date().toISOString();

      await Bun.write(userFilePath, JSON.stringify(userData, null, 2));
      logger.debug(`Saved user data for @${userData.username}`);
    } catch (error) {
      logger.error(`Failed to save user data for @${userData.username}`, error as Error);
      throw error;
    }
  }

  async exportUserData(username: string, format: 'json' | 'csv' = 'json'): Promise<string> {
    const userData = await this.getUserData(username);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    if (format === 'json') {
      const filename = `${username}_export_${timestamp}.json`;
      const filepath = path.join(this.dataDir, filename);
      await Bun.write(filepath, JSON.stringify(userData, null, 2));
      return filepath;
    } else {
      // CSV export for posts
      const filename = `${username}_posts_${timestamp}.csv`;
      const filepath = path.join(this.dataDir, filename);

      const csvContent = [
        'text,photos,videos,timestamp',
        ...userData.posts.map(post =>
          `"${post.text.replace(/"/g, '""')}","${post.photos?.map(p => p.url).join(';') || ''}","${post.videos?.map(v => v.url).join(';') || ''}","${userData.lastUpdated}"`
        )
      ].join('\n');

      await Bun.write(filepath, csvContent);
      return filepath;
    }
  }

  async listUsers(): Promise<string[]> {
    try {
      const files = fs.readdirSync(this.dataDir);
      return files
        .filter(file => file.endsWith('.json') && !file.startsWith('_'))
        .map(file => file.replace('.json', ''));
    } catch (error) {
      logger.error("Failed to list users", error as Error);
      return [];
    }
  }

  async deleteUserData(username: string): Promise<boolean> {
    try {
      const userFilePath = path.join(this.dataDir, `${username}.json`);
      if (fs.existsSync(userFilePath)) {
        fs.unlinkSync(userFilePath);
        logger.info(`Deleted user data for @${username}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Failed to delete user data for @${username}`, error as Error);
      return false;
    }
  }

  async getDataStats(): Promise<{ totalUsers: number; totalDataSize: string; lastUpdated?: string }> {
    try {
      const users = await this.listUsers();
      const files = fs.readdirSync(this.dataDir);
      let totalSize = 0;
      let lastUpdated: string | undefined;

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.dataDir, file);
          const stats = fs.statSync(filePath);
          totalSize += stats.size;

          if (!lastUpdated || stats.mtime > new Date(lastUpdated)) {
            lastUpdated = stats.mtime.toISOString();
          }
        }
      }

      return {
        totalUsers: users.length,
        totalDataSize: this.formatBytes(totalSize),
        lastUpdated
      };
    } catch (error) {
      logger.error("Failed to get data stats", error as Error);
      return { totalUsers: 0, totalDataSize: "0 B" };
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const dataService = new DataService();
