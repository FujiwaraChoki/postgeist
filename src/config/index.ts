import path from "path";
import os from "os";
import { LogLevel } from "../../logger";
import type { AppConfig, ScraperConfig } from "../types";

export class Config {
  private static instance: Config;
  private _appConfig: AppConfig;
  private _scraperConfig: ScraperConfig;

  private constructor() {
    // Default data directory in user's home directory
    const defaultDataDir = path.join(os.homedir(), ".postgeist");

    this._appConfig = {
      dataDir: process.env.DATA_DIR || defaultDataDir,
      logLevel: process.env.LOG_LEVEL || "WARN",
      maxPostsToAnalyze: parseInt(process.env.MAX_POSTS_TO_ANALYZE || "400"),
      maxPostsForPrompt: parseInt(process.env.MAX_POSTS_FOR_PROMPT || "50")
    };

    this._scraperConfig = {
      username: process.env.TWITTER_USERNAME,
      password: process.env.TWITTER_PASSWORD,
      email: process.env.TWITTER_EMAIL
    };
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  public get app(): AppConfig {
    return this._appConfig;
  }

  public get scraper(): ScraperConfig {
    return this._scraperConfig;
  }

  public validateTwitterCredentials(): boolean {
    return !!(this._scraperConfig.username && this._scraperConfig.password);
  }

  public getLogLevel(): LogLevel {
    switch (this._appConfig.logLevel.toUpperCase()) {
      case "DEBUG": return LogLevel.DEBUG;
      case "INFO": return LogLevel.INFO;
      case "WARN": return LogLevel.WARN;
      case "ERROR": return LogLevel.ERROR;
      default: return LogLevel.WARN;
    }
  }

  public getMissingCredentials(): string[] {
    const missing: string[] = [];
    if (!this._scraperConfig.username) missing.push("TWITTER_USERNAME");
    if (!this._scraperConfig.password) missing.push("TWITTER_PASSWORD");
    return missing;
  }
}

export const config = Config.getInstance();
