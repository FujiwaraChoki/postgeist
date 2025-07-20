import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import type { Analysis, PostIdea, UserData, TwitterPost } from "../types";
import { config } from "../config";
import { createLogger } from "../../logger";
import { dataService } from "./data";
import prompts from "../../prompts";

const logger = createLogger("AIService");

export class AIService {
  private model: any;

  constructor() {
    this.model = google("gemini-2.5-flash");
  }

  async analyzeUser(username: string, posts: TwitterPost[]): Promise<Analysis> {
    try {
      if (posts.length === 0) {
        throw new Error("No posts available for analysis. Please fetch posts first.");
      }

      logger.info(`Analyzing ${posts.length} posts for @${username}`);

      const analysis = await generateText({
        system: prompts.analyze,
        model: this.model,
        experimental_output: Output.object({
          schema: z.object({
            summary: z.string().describe("A concise summary of the user's activity"),
            key_themes: z.array(z.string()).describe("Key themes and topics the user is interested in"),
            engagement_patterns: z.array(z.string()).describe("Patterns of engagement the user has"),
            unique_behaviors: z.array(z.string()).describe("Unique behaviors the user exhibits"),
            opportunities: z.array(z.string()).describe("Opportunities for growth or improvement"),
            tone: z.string().describe("An incredibly detailed analysis of the user's tone and style of posting"),
          }),
        }),
        prompt: `
          Analyze the following posts for @${username}:
          ${posts.map((post, index) => `${index + 1}. ${post.text}`).join("\n")}
        `
      });

      logger.info(`Analysis completed for @${username}`);

      return analysis.experimental_output;
    } catch (error) {
      logger.error(`Analysis failed for @${username}`, error as Error);

      if (error instanceof Error) {
        if (error.message.includes('quota') || error.message.includes('limit')) {
          throw new Error('AI service quota exceeded. Please try again later.');
        } else if (error.message.includes('timeout')) {
          throw new Error('AI service timeout. The analysis took too long, please try again.');
        }
      }

      throw error;
    }
  }

  async generatePostIdeas(userData: UserData, count: number = 10): Promise<PostIdea[]> {
    try {
      if (!userData.analysis) {
        throw new Error("No analysis found. Please analyze the user first.");
      }

      if (userData.posts.length === 0) {
        throw new Error("No posts available for generation. Please fetch posts first.");
      }

      logger.info(`Generating ${count} post ideas for @${userData.username}`);

      const postsForPrompt = userData.posts
        .slice(0, config.app.maxPostsForPrompt)
        .map((post: TwitterPost, index: number) => {
          const postAttachments: string[] = [];
          if (post.photos && post.photos.length > 0) {
            postAttachments.push(...post.photos.map((photo) => `Photo: ${photo.url}`));
          }
          if (post.videos && post.videos.length > 0) {
            postAttachments.push(...post.videos.map((video) => `Video: ${video.url}`));
          }
          return `${index + 1}. ${post.text}${postAttachments.length > 0
            ? `\n   Attachments:\n   - ${postAttachments.join('\n   - ')}`
            : ''
            }`;
        })
        .join("\n");

      const customInstructionsSection = userData.customInstructions
        ? `\n\nCUSTOM INSTRUCTIONS:\n${userData.customInstructions}\n\nMake sure to follow these custom instructions carefully when generating posts.`
        : '';

      const communitiesSection = userData.availableCommunities && userData.availableCommunities.length > 0
        ? `\n\nAVAILABLE COMMUNITIES:\n${userData.availableCommunities.map(c => `- ${c.name}: ${c.description}`).join('\n')}\n\nFor each post, decide whether it should be posted to one of these communities or no community at all. Only assign a community if the post content directly relates to that community's focus.`
        : '\n\nNo communities available - set community to null for all posts.';

      const randomFactsSection = userData.randomFacts && userData.randomFacts.length > 0
        ? `\n\nRANDOM FACTS ABOUT USER:\n${userData.randomFacts.map((fact, index) => `${index + 1}. ${fact}`).join('\n')}\n\nUse these facts strategically to add authentic personal touches to posts when they would naturally fit the user's posting style. Only reference facts that would realistically come up in their normal content.`
        : '';

      const postIdeas = await generateText({
        system: prompts.generate.new_post_idea,
        model: this.model,
        experimental_output: Output.object({
          schema: z.object({
            post_ideas: z.array(z.object({
              text: z.string().describe("The complete post text"),
              community: z.string().nullable().describe("The community name this post should be posted to, or null if no community"),
              reasoning: z.string().optional().describe("Brief explanation of why this community was chosen or why no community")
            })).describe(`A list of ${count} new post ideas with community assignments`)
          }),
        }),
        prompt: `
          Based on this detailed analysis and the user's actual posts, generate ${count} complete, ready-to-post tweets that perfectly match their exact style:

          USER ANALYSIS:
          Summary: ${userData.analysis.summary}
          Key Themes: ${userData.analysis.key_themes.join(", ")}
          Engagement Patterns: ${userData.analysis.engagement_patterns.join(", ")}
          Tone: ${userData.analysis.tone}

          ACTUAL POSTS FROM USER:
          ${postsForPrompt}${customInstructionsSection}${communitiesSection}${randomFactsSection}

          Study these examples carefully and generate posts that:
          - Use the EXACT same writing style, tone, and voice
          - Follow their typical post structure and length
          - Include similar emoji patterns and frequency
          - Reference similar themes and topics they care about
          - Match their punctuation and formatting style
          - Sound like they could have written them today

          Each post should be complete and ready to copy-paste to Twitter with NO editing required.

          For community assignment:
          - Analyze the content and theme of each post
          - Only assign to a community if the post directly relates to that community's focus
          - When in doubt, choose no community (null)
          - Consider the user's typical posting patterns and which communities they would realistically use
        `,
      });

      logger.info(`Generated ${postIdeas.experimental_output.post_ideas.length} post ideas for @${userData.username}`);
      return postIdeas.experimental_output.post_ideas.slice(0, count);
    } catch (error) {
      logger.error(`Post generation failed for @${userData.username}`, error as Error);

      if (error instanceof Error) {
        if (error.message.includes('quota') || error.message.includes('limit')) {
          throw new Error('AI service quota exceeded. Please try again later.');
        } else if (error.message.includes('timeout')) {
          throw new Error('AI service timeout. The generation took too long, please try again.');
        }
      }

      throw error;
    }
  }

  async reanalyzeUser(username: string, posts: TwitterPost[]): Promise<Analysis> {
    // Clear existing analysis and generate fresh one
    const userData = await dataService.getUserData(username);
    userData.analysis = undefined;
    await dataService.saveUserData(userData);

    return this.analyzeUser(username, posts);
  }
}

export const aiService = new AIService();
