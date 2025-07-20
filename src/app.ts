import * as clack from "@clack/prompts";
import chalk from "chalk";
import boxen from "boxen";
import path from "path";
import fs from "fs";
import { config } from "./config";
import { dataService } from "./services/data";
import { scraperService } from "./services/scraper";
import { aiService } from "./services/ai";
import { DisplayUI } from "./ui/display";
import { PromptsUI } from "./ui/prompts";
import { Utils } from "./utils";
import { createLogger } from "../logger";
import type { UserData, PostIdea } from "./types";

const logger = createLogger("PostgeistApp");

export class PostgeistApp {
  private userData: UserData | null = null;
  private initialized = false;

  async run(): Promise<void> {
    try {
      // Initialize and show welcome
      this.initialize();
      DisplayUI.showWelcomeScreen();
      clack.intro(chalk.cyan.bold("Welcome to Postgeist! 🚀"));

      // Check environment setup
      const envCheck = Utils.validateEnvironment();
      if (!envCheck.valid) {
        DisplayUI.showSetupHelp();
        return;
      }

      // Main application loop
      await this.mainLoop();

    } catch (error) {
      if (clack.isCancel(error)) {
        clack.cancel("Operation cancelled.");
        process.exit(0);
      }

      logger.error("Application error", error as Error);
      DisplayUI.showError("An unexpected error occurred. Please try again.");
      process.exit(1);
    }
  }

  private initialize(): void {
    if (this.initialized) {
      return;
    }

    // Set log level from configuration
    logger.setLogLevel(config.getLogLevel());
    logger.info("Postgeist application initialized");
    this.initialized = true;
  }

  private async mainLoop(): Promise<void> {
    while (true) {
      try {
        const action = await PromptsUI.selectAction();

        if (action === "exit") {
          clack.outro(chalk.cyan("Thanks for using Postgeist! 👋"));
          break;
        }

        await this.handleAction(action);

        const shouldContinue = await PromptsUI.shouldContinue();
        if (!shouldContinue) {
          clack.outro(chalk.cyan("Thanks for using Postgeist! 👋"));
          break;
        }

      } catch (error) {
        if (clack.isCancel(error)) {
          throw error; // Re-throw to exit
        }

        Utils.handleError(error, "Action failed");

        // Allow user to continue after errors
        const shouldContinue = await PromptsUI.confirmAction(
          "Would you like to try another action?"
        );
        if (!shouldContinue) break;
      }
    }
  }

  private async handleAction(action: string): Promise<void> {
    switch (action) {
      case "analyze":
        await this.handleAnalyze();
        break;
      case "ideas":
        await this.handleGenerate();
        break;
      case "both":
        await this.handleAnalyzeAndGenerate();
        break;
      case "info":
        await this.handleUserInfo();
        break;
      case "settings":
        await this.handleSettings();
        break;
      case "data":
        await this.handleDataManagement();
        break;
      default:
        DisplayUI.showError(`Unknown action: ${action}`);
    }
  }

  private async getUserData(username?: string): Promise<UserData> {
    if (!username) {
      username = await PromptsUI.getUsernameInput();
    }

    this.userData = await dataService.getUserData(username);
    return this.userData;
  }

  private async handleAnalyze(): Promise<void> {
    const username = await PromptsUI.getUsernameInput();
    const userData = await this.getUserData(username);

    const analysis = await Utils.withProgress(
      this.performAnalysis(username, userData),
      `🔍 Analyzing @${username}...`,
      "✅ Analysis complete!",
      "❌ Analysis failed"
    );

    DisplayUI.showAnalysis(analysis, username);
  }

  private async handleGenerate(): Promise<void> {
    const userData = await this.getExistingUserData();

    if (!userData.analysis) {
      DisplayUI.showError(`No analysis found for @${userData.username}. Please analyze first.`);
      return;
    }

    const postCount = await PromptsUI.selectPostCount();

    const postIdeas = await Utils.withProgress(
      aiService.generatePostIdeas(userData, postCount),
      `💡 Generating ${postCount} post ideas...`,
      "✅ Post ideas generated!",
      "❌ Post generation failed"
    );

    DisplayUI.showPostIdeas(postIdeas);
    await this.offerPostActions(postIdeas);
  }

  private async handleAnalyzeAndGenerate(): Promise<void> {
    const username = await PromptsUI.getUsernameInput();
    const userData = await this.getUserData(username);

    // Analyze
    const analysis = await Utils.withProgress(
      this.performAnalysis(username, userData),
      `🔍 Analyzing @${username}...`,
      "✅ Analysis complete!",
      "❌ Analysis failed"
    );

    DisplayUI.showAnalysis(analysis, username);

    // Generate
    const postCount = await PromptsUI.selectPostCount();

    const postIdeas = await Utils.withProgress(
      aiService.generatePostIdeas(userData, postCount),
      `💡 Generating ${postCount} post ideas...`,
      "✅ Post ideas generated!",
      "❌ Post generation failed"
    );

    DisplayUI.showPostIdeas(postIdeas);
    await this.offerPostActions(postIdeas);
  }

  private async handleUserInfo(): Promise<void> {
    const userData = await this.getExistingUserData();
    DisplayUI.showUserInfo(userData);
  }

  private async handleSettings(): Promise<void> {
    const userData = await this.getExistingUserData();

    while (true) {
      const action = await PromptsUI.selectSettingsAction(userData);

      if (action === "back") break;

      if (action === "instructions") {
        await this.handleCustomInstructions(userData);
      } else if (action === "communities") {
        await this.handleCommunities(userData);
      } else if (action === "facts") {
        await this.handleRandomFacts(userData);
      }
    }
  }

  private async handleDataManagement(): Promise<void> {
    while (true) {
      const action = await PromptsUI.selectDataAction();

      if (action === "back") break;

      switch (action) {
        case "stats":
          const stats = dataService.getDataStats();
          DisplayUI.showDataStats(stats);
          break;

        case "export":
          await this.handleExport();
          break;

        case "list":
          await this.handleListUsers();
          break;

        case "cleanup":
          await this.handleCleanup();
          break;
      }
    }
  }

  private async performAnalysis(username: string, userData: UserData) {
    // Fetch posts if needed
    if (userData.posts.length === 0) {
      const posts = await scraperService.fetchPosts(username);
      userData.posts = posts;
      await dataService.saveUserData(userData);
    }

    // Perform analysis and update userData with results
    const analysis = await aiService.analyzeUser(username, userData.posts);
    userData.analysis = analysis;
    await dataService.saveUserData(userData);

    return analysis;
  }

  private async getExistingUserData(): Promise<UserData> {
    const users = await dataService.listUsers();

    if (users.length === 0) {
      const username = await PromptsUI.getUsernameInput();
      return await this.getUserData(username);
    }

    if (users.length === 1) {
      return await this.getUserData(users[0]);
    }

    // Multiple users - let them choose
    const selectedUser = await PromptsUI.selectUser(users);
    return await this.getUserData(selectedUser);
  }

  private async handleCustomInstructions(userData: UserData): Promise<void> {
    while (true) {
      const action = await PromptsUI.selectInstructionsAction(!!userData.customInstructions);

      if (action === "back") break;

      switch (action) {
        case "view":
          if (userData.customInstructions) {
            DisplayUI.showCustomInstructions(userData.customInstructions);
          } else {
            DisplayUI.showInfo("No custom instructions are currently set.");
          }
          break;

        case "edit":
          const instructions = await PromptsUI.getCustomInstructions(userData.customInstructions);
          userData.customInstructions = instructions.trim();
          await dataService.saveUserData(userData);
          DisplayUI.showSuccess("Custom instructions updated!");
          break;

        case "clear":
          if (userData.customInstructions) {
            const confirm = await PromptsUI.confirmAction(
              "Are you sure you want to clear all custom instructions?"
            );
            if (confirm) {
              userData.customInstructions = undefined;
              await dataService.saveUserData(userData);
              DisplayUI.showSuccess("Custom instructions cleared!");
            }
          } else {
            DisplayUI.showInfo("No custom instructions to clear.");
          }
          break;
      }
    }
  }

  private async handleCommunities(userData: UserData): Promise<void> {
    while (true) {
      const communities = userData.availableCommunities || [];
      const action = await PromptsUI.selectCommunityAction(communities);

      if (action === "back") break;

      switch (action) {
        case "view":
          if (communities.length > 0) {
            DisplayUI.showCommunities(communities);
          } else {
            DisplayUI.showInfo("No communities are currently configured.");
          }
          break;

        case "add":
          const existingNames = communities.map(c => c.name);
          const name = await PromptsUI.getCommunityName(existingNames);
          const description = await PromptsUI.getCommunityDescription();

          if (!userData.availableCommunities) {
            userData.availableCommunities = [];
          }
          userData.availableCommunities.push({ name: name.trim(), description: description.trim() });

          await dataService.saveUserData(userData);
          DisplayUI.showSuccess(`Community "${name}" added!`);
          break;

        case "remove":
          if (communities.length > 0) {

            const index = await PromptsUI.selectCommunityToRemove(communities);
            const selectedCommunity = communities[index];

            if (selectedCommunity) {
              const confirm = await PromptsUI.confirmAction(
                `Are you sure you want to remove "${selectedCommunity.name}"?`
              );

              if (confirm) {
                userData.availableCommunities!.splice(index, 1);
                await dataService.saveUserData(userData);
                DisplayUI.showSuccess(`Community "${selectedCommunity.name}" removed!`);
              }
            }
          }
          break;
      }
    }
  }

  private async handleRandomFacts(userData: UserData): Promise<void> {
    while (true) {
      const facts = userData.randomFacts || [];
      const action = await PromptsUI.selectFactsAction(facts);

      if (action === "back") break;

      switch (action) {
        case "view":
          if (facts.length > 0) {
            DisplayUI.showRandomFacts(facts);
          } else {
            DisplayUI.showInfo("No random facts are currently configured.");
          }
          break;

        case "add":
          const existingFacts = facts;
          const fact = await PromptsUI.getRandomFact(existingFacts);

          if (!userData.randomFacts) {
            userData.randomFacts = [];
          }
          userData.randomFacts.push(fact);

          await dataService.saveUserData(userData);
          DisplayUI.showSuccess(`Random fact added!`);

          // Show encouragement if approaching the minimum of 50
          if (userData.randomFacts.length < 50) {
            const remaining = 50 - userData.randomFacts.length;
            DisplayUI.showInfo(`💡 Tip: Add ${remaining} more facts to reach the recommended minimum of 50 for better AI personalization.`);
          }
          break;

        case "remove":
          if (facts.length > 0) {
            const index = await PromptsUI.selectFactToRemove(facts);
            const selectedFact = facts[index];

            if (selectedFact) {
              const confirm = await PromptsUI.confirmAction(
                `Are you sure you want to remove this fact: "${selectedFact.length > 60 ? selectedFact.substring(0, 60) + '...' : selectedFact}"?`
              );

              if (confirm) {
                userData.randomFacts!.splice(index, 1);
                await dataService.saveUserData(userData);
                DisplayUI.showSuccess(`Random fact removed!`);
              }
            }
          } else {
            DisplayUI.showInfo("No facts to remove.");
          }
          break;

        case "clear":
          if (facts.length > 0) {
            const confirm = await PromptsUI.confirmAction(
              `Are you sure you want to clear all ${facts.length} random facts?`
            );
            if (confirm) {
              userData.randomFacts = [];
              await dataService.saveUserData(userData);
              DisplayUI.showSuccess("All random facts cleared!");
            }
          } else {
            DisplayUI.showInfo("No facts to clear.");
          }
          break;
      }
    }
  }

  private async handleExport(): Promise<void> {
    const userData = await this.getExistingUserData();
    const format = await PromptsUI.selectExportFormat();

    try {
      const filePath = await dataService.exportUserData(userData.username, format);
      DisplayUI.showSuccess(`Data exported to: ${filePath}`);
    } catch (error) {
      Utils.handleError(error, "Export failed");
    }
  }

  private async handleListUsers(): Promise<void> {
    const users = await dataService.listUsers();

    if (users.length === 0) {
      DisplayUI.showInfo("No users found. Analyze a Twitter profile to get started!");
      return;
    }

    console.log(chalk.cyan.bold("\n📋 Analyzed Users:"));
    for (const username of users) {
      const userData = await dataService.getUserData(username);
      const stats = Utils.calculateUserStats(userData);

      console.log(
        chalk.white(`  @${username}`) +
        chalk.gray(` - ${stats.totalPosts} posts, `) +
        (stats.hasAnalysis ? chalk.green("analyzed") : chalk.red("not analyzed")) +
        chalk.gray(` (${stats.daysSinceUpdate} days ago)`)
      );
    }
  }

  private async handleCleanup(): Promise<void> {
    const users = await dataService.listUsers();

    if (users.length === 0) {
      DisplayUI.showInfo("No data to clean up.");
      return;
    }

    const userToDelete = await PromptsUI.selectUser(users);
    const confirm = await PromptsUI.confirmAction(
      `Are you sure you want to delete all data for @${userToDelete}?`
    );

    if (confirm) {
      const success = await dataService.deleteUserData(userToDelete);
      if (success) {
        DisplayUI.showSuccess(`Data for @${userToDelete} has been deleted.`);
      } else {
        DisplayUI.showError(`Failed to delete data for @${userToDelete}.`);
      }
    }
  }

  private async offerPostActions(postIdeas: PostIdea[]): Promise<void> {
    const action = await clack.select({
      message: "What would you like to do with these post ideas?",
      options: [
        { value: "copy", label: "📋 Copy a specific post", hint: "Select and copy one post" },
        { value: "view_compact", label: "📖 Switch to compact view", hint: "See more posts at once" },
        { value: "view_detailed", label: "📑 Switch to detailed view", hint: "See full post details" },
        { value: "export", label: "📁 Export all posts", hint: "Save to file" },
        { value: "stats", label: "📊 View detailed statistics", hint: "Show comprehensive post stats" },
        { value: "continue", label: "➡️  Continue", hint: "Move on" }
      ]
    }) as string;

    switch (action) {
      case "copy":
        const selectedPost = await PromptsUI.selectFromList(
          "Select a post to copy:",
          postIdeas,
          (idea: PostIdea) => {
            const index = postIdeas.indexOf(idea) + 1;
            return `${index}. ${Utils.truncateText(idea.text, 60)}`;
          },
          (idea: PostIdea) => {
            const charCount = idea.text.length;
            const charInfo = charCount > 280 ? chalk.red(`${charCount}/280`) :
              charCount > 240 ? chalk.yellow(`${charCount}/280`) :
                chalk.green(`${charCount}/280`);
            return idea.community ?
              `${chalk.blue(idea.community)} • ${charInfo}` :
              `${chalk.gray("General")} • ${charInfo}`;
          }
        );
        await Utils.copyToClipboard(selectedPost.text);
        break;

      case "view_compact":
        DisplayUI.showPostIdeasCompact(postIdeas);
        await this.offerPostActions(postIdeas); // Recursive call for continued interaction
        break;

      case "view_detailed":
        DisplayUI.showPostIdeas(postIdeas);
        await this.offerPostActions(postIdeas); // Recursive call for continued interaction
        break;

      case "export":
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `post_ideas_${timestamp}.txt`;
        const filePath = path.join(config.app.dataDir, filename);

        // Ensure data directory exists
        if (!fs.existsSync(config.app.dataDir)) {
          fs.mkdirSync(config.app.dataDir, { recursive: true });
        }

        const content = postIdeas.map((idea, index) => {
          const separator = "============================================================";
          return `${separator}\nPOST ${index + 1}\n${separator}\n` +
            `Text: ${idea.text}\n` +
            `Characters: ${idea.text.length}/280\n` +
            `Community: ${idea.community || 'General'}\n` +
            (idea.reasoning ? `Reasoning: ${idea.reasoning}\n` : '') +
            `\n`;
        }).join('\n');

        await Bun.write(filePath, content);
        DisplayUI.showSuccess(`Post ideas exported to: ${filePath}`);
        break;

      case "stats":
        await this.showDetailedPostStats(postIdeas);
        break;
    }
  }

  private async showDetailedPostStats(postIdeas: PostIdea[]): Promise<void> {
    const stats = Utils.generatePostIdeasStats(postIdeas);
    const charCounts = postIdeas.map(p => p.text.length);
    const avgLength = Math.round(charCounts.reduce((sum, len) => sum + len, 0) / charCounts.length);
    const maxLength = Math.max(...charCounts);
    const minLength = Math.min(...charCounts);

    // Community breakdown
    const communityStats = postIdeas.reduce((acc, post) => {
      const community = post.community || 'General';
      acc[community] = (acc[community] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Character length distribution
    const lengthRanges = {
      'Short (0-140)': charCounts.filter(len => len <= 140).length,
      'Medium (141-240)': charCounts.filter(len => len > 140 && len <= 240).length,
      'Long (241-280)': charCounts.filter(len => len > 240 && len <= 280).length,
      'Too Long (>280)': charCounts.filter(len => len > 280).length
    };

    let statsContent = chalk.cyan.bold("📊 Detailed Post Statistics") + "\n\n";

    statsContent += chalk.white.bold("📏 Length Analysis:") + "\n";
    statsContent += chalk.yellow(`• Average: ${avgLength} characters`) + "\n";
    statsContent += chalk.yellow(`• Range: ${minLength} - ${maxLength} characters`) + "\n\n";

    statsContent += chalk.white.bold("📈 Length Distribution:") + "\n";
    Object.entries(lengthRanges).forEach(([range, count]) => {
      const percentage = Math.round((count / postIdeas.length) * 100);
      const color = range.includes('Too Long') ? 'red' : range.includes('Long') ? 'yellow' : 'green';
      statsContent += chalk[color](`• ${range}: ${count} posts (${percentage}%)`) + "\n";
    });

    if (Object.keys(communityStats).length > 1) {
      statsContent += "\n" + chalk.white.bold("🏘️  Community Breakdown:") + "\n";
      Object.entries(communityStats).forEach(([community, count]) => {
        const percentage = Math.round((count / postIdeas.length) * 100);
        statsContent += chalk.blue(`• ${community}: ${count} posts (${percentage}%)`) + "\n";
      });
    }

    console.log("\n" + boxen(statsContent, {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "magenta"
    }));
  }

  // Public methods for non-interactive CLI usage
  public async analyzeUser(username: string): Promise<void> {
    this.initialize();

    const userData = await dataService.getUserData(username);

    const analysis = await Utils.withProgress(
      this.performAnalysis(username, userData),
      `🔍 Analyzing @${username}...`,
      "✅ Analysis complete!",
      "❌ Analysis failed"
    );

    DisplayUI.showAnalysis(analysis, username);
  }

  public async generateForUser(username: string, count: number = 10): Promise<void> {
    this.initialize();

    const userData = await dataService.getUserData(username);

    if (!userData.analysis) {
      throw new Error(`No analysis found for @${username}. Please analyze first.`);
    }

    const postIdeas = await Utils.withProgress(
      aiService.generatePostIdeas(userData, count),
      `💡 Generating ${count} post ideas for @${username}...`,
      "✅ Post ideas generated!",
      "❌ Post generation failed"
    );

    DisplayUI.showPostIdeas(postIdeas);
    await this.exportPostIdeas(postIdeas, username);
  }

  public async analyzeAndGenerate(username: string, count: number = 10): Promise<void> {
    this.initialize();

    const userData = await dataService.getUserData(username);

    // Analyze
    const analysis = await Utils.withProgress(
      this.performAnalysis(username, userData),
      `🔍 Analyzing @${username}...`,
      "✅ Analysis complete!",
      "❌ Analysis failed"
    );

    DisplayUI.showAnalysis(analysis, username);

    // Generate
    const postIdeas = await Utils.withProgress(
      aiService.generatePostIdeas(userData, count),
      `💡 Generating ${count} post ideas for @${username}...`,
      "✅ Post ideas generated!",
      "❌ Post generation failed"
    );

    DisplayUI.showPostIdeas(postIdeas);
    await this.exportPostIdeas(postIdeas, username);
  }

  private async exportPostIdeas(postIdeas: PostIdea[], username: string): Promise<void> {
    // Auto-export in non-interactive mode
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${username}_post_ideas_${timestamp}.txt`;
    const filePath = path.join(config.app.dataDir, filename);

    // Ensure data directory exists
    if (!fs.existsSync(config.app.dataDir)) {
      fs.mkdirSync(config.app.dataDir, { recursive: true });
    }

    const content = postIdeas.map((idea, index) =>
      `${index + 1}. ${idea.text}\n${idea.community ? `   Community: ${idea.community}\n` : ''}${idea.reasoning ? `   Reasoning: ${idea.reasoning}\n` : ''}\n`
    ).join('\n');

    await Bun.write(filePath, content);
    DisplayUI.showSuccess(`📁 Post ideas exported to: ${filePath}`);
  }
}
