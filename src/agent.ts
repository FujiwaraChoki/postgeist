import { generateText, tool, streamText } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { createLogger } from "../logger";
import { webSearch } from "./tools/web-search";
import { websiteVisit } from "./tools/website-visit";
import { scraperService } from "./services/scraper";
import { aiService } from "./services/ai";
import { dataService } from "./services/data";
import { DisplayUI } from "./ui/display";
import chalk from "chalk";
import ora from "ora";

const logger = createLogger("PostgeistAgent");

/**
 * Postgeist AI Agent - A standalone agent for Twitter analysis and content generation
 *
 * This agent can:
 * - Analyze Twitter profiles and posting patterns
 * - Generate authentic post ideas matching user's style
 * - Search the web for current information
 * - Visit websites and extract content
 * - Run in a conversational loop
 */
export class PostgeistAgent {
  private model: any;
  private maxSteps: number = 10;
  private messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

  constructor() {
    this.model = google("gemini-2.5-flash");
    this.initializeConversation();
  }

  private initializeConversation() {
    this.messages = [{
      role: 'system',
      content: `You are Postgeist, an expert AI agent specializing in Twitter analysis and content generation.

Your capabilities include:
- Analyzing Twitter users' posting patterns, themes, and writing style
- Generating authentic post ideas that match users' unique voices
- Searching the web for current information
- Visiting websites to extract content
- Managing user data and providing insights

Guidelines:
- Always be helpful, professional, and detailed in your responses
- When analyzing users, provide comprehensive insights about their posting style
- When generating posts, ensure they authentically match the user's voice
- Use web search and website visits when you need current information
- Explain what you're doing step by step
- If errors occur, provide clear explanations and suggestions
- Remember previous conversations and maintain context throughout the session
- Analysis data is automatically saved and persisted for future use

Current capabilities:
- analyzeTwitterUser: Analyze posting patterns and style of any Twitter user
- generatePostIdeas: Create authentic post ideas matching a user's style
- getUserInfo: Get information about previously analyzed users
- listUsers: Show all analyzed users
- web_search: Search the web for current information
- website_visit: Extract content from websites

Remember: You can analyze any public Twitter user and generate content that matches their authentic voice and style. All analysis data is automatically saved for future reference.`
    }];
  }

  /**
   * Reset conversation history (useful for testing or starting fresh)
   */
  resetConversation(): void {
    this.initializeConversation();
    logger.info("Conversation history reset");
  }

  /**
   * Get conversation history length
   */
  getConversationLength(): number {
    return this.messages.length;
  }

  /**
   * Tool for analyzing Twitter users
   */
  private analyzeTwitterUser = tool({
    description: "Analyze a Twitter user's posts, patterns, and style to understand their voice and content themes",
    parameters: z.object({
      username: z.string().describe("Twitter username to analyze (without @)"),
      refresh: z.boolean().optional().default(false).describe("Whether to fetch fresh posts or use cached data")
    }),
    execute: async ({ username, refresh = false }) => {
      const spinner = ora({
        text: `Analyzing @${username}...`,
        color: 'blue'
      }).start();

      try {
        logger.info(`Analyzing Twitter user: @${username}`);

        // Fetch or refresh posts
        spinner.text = refresh
          ? `Fetching fresh posts for @${username}...`
          : `Loading posts for @${username}...`;

        const posts = refresh
          ? await scraperService.refreshPosts(username)
          : await scraperService.fetchPosts(username);

        if (posts.length === 0) {
          spinner.fail(`No posts found for @${username}`);
          return {
            success: false,
            error: `No posts found for @${username}. User may not exist or have no public posts.`
          };
        }

        // Analyze the user
        spinner.text = `Analyzing ${posts.length} posts with AI...`;
        const analysis = await aiService.analyzeUser(username, posts);

        // Save the analysis to make it persistent
        spinner.text = `Saving analysis for @${username}...`;
        const userData = await dataService.getUserData(username);
        userData.analysis = analysis;
        userData.posts = posts; // Ensure posts are also saved
        await dataService.saveUserData(userData);

        spinner.succeed(`Successfully analyzed @${username} (${posts.length} posts)`);

        return {
          success: true,
          username,
          postsCount: posts.length,
          analysis: {
            summary: analysis.summary,
            keyThemes: analysis.key_themes,
            engagementPatterns: analysis.engagement_patterns,
            tone: analysis.tone,
            opportunities: analysis.opportunities,
            contentTaxonomy: analysis.content_taxonomy?.slice(0, 5) || [],
            thematicAnalysis: analysis.thematic_analysis?.slice(0, 5) || [],
            untappedOpportunities: analysis.untapped_opportunities?.slice(0, 5) || [],
            voiceArchitecture: analysis.voice_architecture || "Not analyzed"
          }
        };
      } catch (error) {
        spinner.fail(`Analysis failed for @${username}`);
        logger.error(`Twitter analysis failed for @${username}`, error as Error);
        return {
          success: false,
          error: `Failed to analyze @${username}: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }
  });

  /**
   * Tool for generating post ideas
   */
  private generatePostIdeas = tool({
    description: "Generate authentic post ideas that match a Twitter user's style and voice",
    parameters: z.object({
      username: z.string().describe("Twitter username to generate posts for"),
      count: z.number().optional().default(5).describe("Number of post ideas to generate (1-20)"),
      customInstructions: z.string().optional().describe("Custom instructions for post generation")
    }),
    execute: async ({ username, count = 5, customInstructions }) => {
      const spinner = ora({
        text: `Generating ${count} post ideas for @${username}...`,
        color: 'green'
      }).start();

      try {
        logger.info(`Generating ${count} post ideas for @${username}`);

        // Get user data
        spinner.text = `Loading user data for @${username}...`;
        const userData = await dataService.getUserData(username);

        if (!userData.analysis) {
          spinner.fail(`No analysis found for @${username}`);
          return {
            success: false,
            error: `No analysis found for @${username}. Please analyze the user first.`
          };
        }

        if (userData.posts.length === 0) {
          spinner.fail(`No posts found for @${username}`);
          return {
            success: false,
            error: `No posts found for @${username}. Please analyze the user first.`
          };
        }

        // Add custom instructions if provided
        if (customInstructions) {
          spinner.text = `Saving custom instructions...`;
          userData.customInstructions = customInstructions;
          await dataService.saveUserData(userData);
        }

        // Generate post ideas
        spinner.text = `Generating ${count} authentic post ideas with AI...`;
        const postIdeas = await aiService.generatePostIdeas(userData, Math.min(count, 20));

        spinner.succeed(`Generated ${postIdeas.length} post ideas for @${username}`);

        // Display the post ideas beautifully in the terminal
        DisplayUI.showPostIdeas(postIdeas);

        return {
          success: true,
          username,
          count: postIdeas.length,
          postIdeas: postIdeas.map(idea => ({
            text: idea.text,
            community: idea.community,
            reasoning: idea.reasoning,
            characterCount: idea.text.length
          }))
        };
      } catch (error) {
        spinner.fail(`Post generation failed for @${username}`);
        logger.error(`Post generation failed for @${username}`, error as Error);
        return {
          success: false,
          error: `Failed to generate posts for @${username}: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }
  });

  /**
   * Tool for getting user information
   */
  private getUserInfo = tool({
    description: "Get information about a previously analyzed Twitter user",
    parameters: z.object({
      username: z.string().describe("Twitter username to get info for")
    }),
    execute: async ({ username }) => {
      const spinner = ora({
        text: `Getting info for @${username}...`,
        color: 'cyan'
      }).start();

      try {
        const userData = await dataService.getUserData(username);

        spinner.succeed(`Retrieved info for @${username}`);

        if (userData.posts.length === 0) {
          spinner.fail(`No data found for @${username}`);
          return {
            success: false,
            error: `No data found for @${username}. User has not been analyzed yet.`
          };
        }

        return {
          success: true,
          username,
          lastUpdated: userData.lastUpdated,
          postsCount: userData.posts.length,
          hasAnalysis: !!userData.analysis,
          customInstructions: userData.customInstructions || null,
          communities: userData.availableCommunities || [],
          summary: userData.analysis?.summary || "No analysis available"
        };
      } catch (error) {
        spinner.fail(`Failed to get info for @${username}`);
        logger.error(`Failed to get user info for @${username}`, error as Error);
        return {
          success: false,
          error: `Failed to get info for @${username}: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }
  });

  /**
   * Tool for listing analyzed users
   */
  private listUsers = tool({
    description: "List all previously analyzed Twitter users",
    parameters: z.object({}),
    execute: async () => {
      const spinner = ora({
        text: 'Loading analyzed users...',
        color: 'magenta'
      }).start();

      try {
        const users = await dataService.listUsers();

        if (users.length === 0) {
          spinner.succeed('No users have been analyzed yet');
          return {
            success: true,
            message: "No users have been analyzed yet.",
            users: []
          };
        }

        spinner.text = `Loading details for ${users.length} users...`;
        const userInfos = await Promise.all(
          users.map(async (username) => {
            const userData = await dataService.getUserData(username);
            return {
              username,
              postsCount: userData.posts.length,
              hasAnalysis: !!userData.analysis,
              lastUpdated: userData.lastUpdated
            };
          })
        );

        spinner.succeed(`Retrieved ${users.length} analyzed users`);

        return {
          success: true,
          count: users.length,
          users: userInfos
        };
      } catch (error) {
        spinner.fail('Failed to list users');
        logger.error("Failed to list users", error as Error);
        return {
          success: false,
          error: `Failed to list users: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }
  });

  /**
   * Main agent conversation method
   */
  async chat(message: string): Promise<string> {
    const spinner = ora({
      text: 'Thinking...',
      color: 'yellow'
    });

    try {
      console.log(chalk.blue(`\n🤖 Processing: ${message}`));
      spinner.start();

      // Add user message to conversation history
      this.messages.push({ role: 'user', content: message });

      const result = await generateText({
        model: this.model,
        maxSteps: this.maxSteps,
        messages: this.messages,
        tools: {
          analyzeTwitterUser: this.analyzeTwitterUser,
          generatePostIdeas: this.generatePostIdeas,
          getUserInfo: this.getUserInfo,
          listUsers: this.listUsers,
          web_search: webSearch,
          website_visit: websiteVisit
        }
      });

      // Add assistant response to conversation history
      this.messages.push({ role: 'assistant', content: result.text });

      // Keep conversation history manageable (last 20 messages + system)
      if (this.messages.length > 21) {
        const systemMessage = this.messages[0];
        const recentMessages = this.messages.slice(-20);
        if (systemMessage) {
          this.messages = [systemMessage, ...recentMessages];
        } else {
          this.messages = recentMessages;
        }
      }

      spinner.stop();
      return result.text;
    } catch (error) {
      spinner.fail('Processing failed');
      logger.error("Agent chat failed", error as Error);
      return `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`;
    }
  }

  /**
   * Stream responses for real-time interaction
   */
  async *chatStream(message: string): AsyncGenerator<string, void, unknown> {
    try {
      console.log(chalk.blue(`\n🤖 Processing: ${message}`));

      // Add user message to conversation history
      this.messages.push({ role: 'user', content: message });

      const result = streamText({
        model: this.model,
        maxSteps: this.maxSteps,
        messages: this.messages,
        tools: {
          analyzeTwitterUser: this.analyzeTwitterUser,
          generatePostIdeas: this.generatePostIdeas,
          getUserInfo: this.getUserInfo,
          listUsers: this.listUsers,
          web_search: webSearch,
          website_visit: websiteVisit
        }
      });

      let responseText = '';
      for await (const delta of (await result).textStream) {
        responseText += delta;
        yield delta;
      }

      // Add assistant response to conversation history
      this.messages.push({ role: 'assistant', content: responseText });

      // Keep conversation history manageable (last 20 messages + system)
      if (this.messages.length > 21) {
        const systemMessage = this.messages[0];
        const recentMessages = this.messages.slice(-20);
        if (systemMessage) {
          this.messages = [systemMessage, ...recentMessages];
        } else {
          this.messages = recentMessages;
        }
      }
    } catch (error) {
      logger.error("Agent stream failed", error as Error);
      yield `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`;
    }
  }

  /**
   * Run the agent in an interactive loop
   */
  async runLoop(): Promise<void> {
    console.log(chalk.cyan.bold("\n🚀 Postgeist AI Agent - Interactive Mode"));
    console.log(chalk.gray("Ask me to analyze Twitter users, generate posts, search the web, or anything else!"));
    console.log(chalk.gray("Type 'exit' to quit.\n"));

    const { text } = await import("@clack/prompts");

    while (true) {
      try {
        const userInput = await text({
          message: "What would you like me to do?",
          placeholder: "e.g., 'Analyze @elonmusk and generate 5 post ideas'"
        });

        if (!userInput || userInput === "exit" || typeof userInput !== 'string') {
          console.log(chalk.cyan("👋 Goodbye!"));
          break;
        }

        // Get response from agent
        const response = await this.chat(userInput);
        console.log(chalk.green(`\n✨ ${response}\n`));

      } catch (error) {
        if (error === null) {
          // User cancelled with Ctrl+C
          console.log(chalk.cyan("\n👋 Goodbye!"));
          break;
        }

        logger.error("Interactive loop error", error as Error);
        console.log(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`));
      }
    }
  }

  /**
   * Process a single command and exit
   */
  async processCommand(command: string): Promise<void> {
    console.log(chalk.cyan.bold("\n🚀 Postgeist AI Agent"));

    const response = await this.chat(command);
    console.log(chalk.green(`\n✨ ${response}\n`));
  }
}

// Export the agent class and a default instance
export const agent = new PostgeistAgent();

// If this file is run directly, start the interactive loop
if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.length > 0) {
    // Process single command
    const command = args.join(" ");
    await agent.processCommand(command);
  } else {
    // Start interactive loop
    await agent.runLoop();
  }
}
