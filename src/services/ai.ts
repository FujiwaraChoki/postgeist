import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import type { Analysis, PostIdea, UserData, TwitterPost } from "../types";
import { config } from "../config";
import { createLogger } from "../../logger";
import { dataService } from "./data";
import prompts from "../../prompts";
import { websiteVisit } from "../tools/website-visit";
import { webSearch } from "../tools/web-search";
import { DisplayUI } from "../ui/display";
import ora from "ora";

const logger = createLogger("AIService");

// Define the schema for post ideas
const postIdeaSchema = z.object({
  text: z.string().describe("The complete post text"),
  community: z.string().nullable().describe("The community name or null"),
  reasoning: z.string().describe("Brief explanation of community choice")
});

const postIdeasSchema = z.object({
  ideas: z.array(postIdeaSchema).describe("Array of generated post ideas")
});

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
        prompt: `
          Analyze the following posts for @${username} and generate comprehensive strategic insights for future content creation.

          Posts to analyze:
          ${posts.map((post, index) => `${index + 1}. ${post.text}`).join("\n")}

          Return the response as a valid JSON object with the following structure:
          {
            "summary": "A comprehensive summary of the user's posting strategy and approach",
            "content_taxonomy": ["Detailed categorization of content types, formats, and structures used"],
            "thematic_analysis": ["Core themes and importantly, unexplored angles within those themes"],
            "linguistic_patterns": ["Exact writing style, vocabulary, sentence structures, punctuation, capitalization patterns"],
            "engagement_mechanics": ["What drives engagement - question types, controversial takes, educational content, personal stories"],
            "temporal_patterns": ["Post frequency, timing, seasonal content, trending topic adoption patterns"],
            "interaction_style": ["How they respond to others, collaboration patterns, community engagement"],
            "expertise_demonstration": ["Areas where they show authority, credibility markers, knowledge sharing methods"],
            "content_evolution": ["How their content has changed over time, new directions emerging"],
            "untapped_opportunities": ["Specific content angles, formats, or themes they haven't explored but would fit their brand"],
            "voice_architecture": "Detailed analysis of the precise construction of their unique voice - tone, formality, personality markers",
            "key_themes": ["Primary themes and topics the user focuses on"],
            "engagement_patterns": ["Observable patterns in how they engage with their audience"],
            "unique_behaviors": ["Distinctive behaviors and approaches that set them apart"],
            "opportunities": ["Strategic opportunities for content growth and audience expansion"],
            "tone": "Extremely detailed analysis of their tone, writing style, and voice characteristics"
          }
        `
      });

      logger.info(`Analysis completed for @${username}`);

      // Parse the JSON response
      const parsed = this.parseAnalysisJson(analysis.text);
      return parsed as Analysis;
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

      const strategicInsightsSection = `\n\nSTRATEGIC CONTENT INSIGHTS:
Content Taxonomy: ${userData.analysis.content_taxonomy?.join(", ") || "Not analyzed"}
Thematic Analysis: ${userData.analysis.thematic_analysis?.join(", ") || "Not analyzed"}
Linguistic Patterns: ${userData.analysis.linguistic_patterns?.join(", ") || "Not analyzed"}
Engagement Mechanics: ${userData.analysis.engagement_mechanics?.join(", ") || "Not analyzed"}
Untapped Opportunities: ${userData.analysis.untapped_opportunities?.join(", ") || "Not analyzed"}
Voice Architecture: ${userData.analysis.voice_architecture || "Not analyzed"}

Use these insights to generate content that represents a natural EVOLUTION of their voice and explores the untapped opportunities identified in the analysis.`;

      const result = await generateText({
        model: this.model,
        tools: {
          website_visit: websiteVisit,
          web_search: webSearch,
        },
        prompt: `${prompts.generate.new_post_idea}

${customInstructionsSection}

⚠️ CRITICAL: The custom instructions above are the HIGHEST PRIORITY. They must be followed EXACTLY and take precedence over all other guidance below. If there is any conflict between custom instructions and other requirements, ALWAYS follow the custom instructions.

USER ANALYSIS:
Summary: ${userData.analysis.summary}
Key Themes: ${userData.analysis.key_themes.join(", ")}
Engagement Patterns: ${userData.analysis.engagement_patterns.join(", ")}
Tone: ${userData.analysis.tone}

🚨 EXISTING POSTS TO AVOID DUPLICATING:
(Study these for STYLE ONLY - DO NOT generate similar content)
${postsForPrompt}

${strategicInsightsSection}
${communitiesSection}

REQUIREMENTS (Secondary to custom instructions):
- Match the user's exact writing style, tone, and voice
- Use similar emoji patterns and formatting
- Make posts 20-280 characters long
- Each post should be ready to copy-paste to Twitter

TOOLS AVAILABLE:
- website_visit: Extract content from websites
- web_search: Search for current information
- Use these tools if the custom instructions mention links or search queries

CRITICAL: You must respond with ONLY a valid JSON array. No other text before or after.

Format exactly like this:
[
  {
    "text": "Your first post text here",
    "community": null,
    "reasoning": "Why this post fits the user's style"
  },
  {
    "text": "Your second post text here",
    "community": "CommunityName",
    "reasoning": "Why this belongs in this community"
  }
]

Generate exactly ${count} posts. Start with [ and end with ]. No markdown, no explanations, just the JSON array.`,
      });

      // Parse the JSON response
      const postIdeas = this.parseJsonFromResponse(result.text, count);

      DisplayUI.showToolSuccess("Post generation completed!");

      logger.info(`Generated ${postIdeas.length} post ideas for @${userData.username}`);
      return postIdeas.slice(0, count);
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

  async generateFromPrompt(prompt: string, count: number = 5, userData?: UserData): Promise<PostIdea[]> {
    try {
      logger.info(`Generating ${count} post ideas from prompt: "${prompt}"`);

      let styleSection = '';
      let existingPostsSection = '';
      let communitiesSection = '\n\nNo communities available - set community to null for all posts.';

      if (userData) {
        // If we have user data, use their style
        if (userData.analysis) {
          styleSection = `
USER STYLE TO MATCH:
Summary: ${userData.analysis.summary}
Key Themes: ${userData.analysis.key_themes.join(", ")}
Engagement Patterns: ${userData.analysis.engagement_patterns.join(", ")}
Tone: ${userData.analysis.tone}
Voice Architecture: ${userData.analysis.voice_architecture || "Not analyzed"}

STYLE REQUIREMENTS:
- Match the user's exact writing style, tone, and voice
- Use similar emoji patterns and formatting
- Use the same sentence structure, punctuation style, and formatting as their past posts
- Match their typical post length and structure
`;

          if (userData.posts && userData.posts.length > 0) {
            const postsForPrompt = userData.posts
              .slice(0, config.app.maxPostsForPrompt)
              .map((post: TwitterPost, index: number) => `${index + 1}. ${post.text}`)
              .join("\n");

            existingPostsSection = `
EXISTING POSTS FOR STYLE REFERENCE:
(Study these for STYLE ONLY - DO NOT generate similar content)
${postsForPrompt}
`;
          }
        }

        if (userData.availableCommunities && userData.availableCommunities.length > 0) {
          communitiesSection = `
AVAILABLE COMMUNITIES:
${userData.availableCommunities.map(c => `- ${c.name}: ${c.description}`).join('\n')}

For each post, decide whether it should be posted to one of these communities or no community at all. Only assign a community if the post content directly relates to that community's focus.`;
        }
      }

      const result = await generateText({
        model: this.model,
        tools: {
          website_visit: websiteVisit,
          web_search: webSearch,
        },
        prompt: `You are PostGeist, an advanced AI content creator for platform X (formerly Twitter).

Your task is to generate COMPLETE, READY-TO-POST tweets based on the following topic/prompt:

TOPIC/PROMPT: "${prompt}"

${styleSection}

${existingPostsSection}

${communitiesSection}

REQUIREMENTS:
- Generate posts that could be posted RIGHT NOW with zero editing
- NO variables, placeholders, or [brackets] - everything must be concrete and specific
- Make posts 20-280 characters long
- Each post should be ready to copy-paste to Twitter
- Focus on the given topic/prompt while ${userData ? 'matching the user\'s style' : 'being engaging and authentic'}
- Generate diverse angles and perspectives on the topic
- Make each post unique and valuable

TOOLS AVAILABLE:
- website_visit: Extract content from websites
- web_search: Search for current information
- Use these tools if you need current information about the topic

CRITICAL: You must respond with ONLY a valid JSON array. No other text before or after.

Format exactly like this:
[
  {
    "text": "Your first post text here",
    "community": null,
    "reasoning": "Why this post fits the topic and style"
  },
  {
    "text": "Your second post text here",
    "community": "CommunityName",
    "reasoning": "Why this belongs in this community"
  }
]

Generate exactly ${count} posts about "${prompt}". Start with [ and end with ]. No markdown, no explanations, just the JSON array.`,
      });

      // Parse the JSON response
      const postIdeas = this.parseJsonFromResponse(result.text, count);

      DisplayUI.showToolSuccess("Prompt-based post generation completed!");

      logger.info(`Generated ${postIdeas.length} post ideas from prompt`);
      return postIdeas.slice(0, count);
    } catch (error) {
      logger.error(`Prompt-based post generation failed`, error as Error);

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

  async tweakPostIdea(originalIdea: PostIdea, feedback: string, userData?: UserData): Promise<PostIdea[]> {
    try {
      logger.info(`Tweaking post idea with feedback: "${feedback}"`);

      let styleSection = '';
      if (userData && userData.analysis) {
        styleSection = `
USER STYLE TO MATCH:
Summary: ${userData.analysis.summary}
Key Themes: ${userData.analysis.key_themes.join(", ")}
Engagement Patterns: ${userData.analysis.engagement_patterns.join(", ")}
Tone: ${userData.analysis.tone}
Voice Architecture: ${userData.analysis.voice_architecture || "Not analyzed"}

STYLE REQUIREMENTS:
- Match the user's exact writing style, tone, and voice
- Use similar emoji patterns and formatting
- Use the same sentence structure, punctuation style, and formatting as their past posts
- Match their typical post length and structure
`;
      }

      let communitiesSection = '\n\nNo communities available - set community to null for all posts.';
      if (userData && userData.availableCommunities && userData.availableCommunities.length > 0) {
        communitiesSection = `
AVAILABLE COMMUNITIES:
${userData.availableCommunities.map(c => `- ${c.name}: ${c.description}`).join('\n')}

For each post, decide whether it should be posted to one of these communities or no community at all. Only assign a community if the post content directly relates to that community's focus.`;
      }

      const result = await generateText({
        model: this.model,
        prompt: `You are PostGeist, an advanced AI content creator for platform X (formerly Twitter).

Your task is to take an existing post idea and create 3 IMPROVED variations based on specific feedback.

ORIGINAL POST:
"${originalIdea.text}"
${originalIdea.community ? `Community: ${originalIdea.community}` : 'Community: General'}
${originalIdea.reasoning ? `Original reasoning: ${originalIdea.reasoning}` : ''}

FEEDBACK TO APPLY:
"${feedback}"

${styleSection}

${communitiesSection}

REQUIREMENTS:
- Create exactly 3 different variations of the original post
- Apply the feedback to improve each variation
- Generate posts that could be posted RIGHT NOW with zero editing
- NO variables, placeholders, or [brackets] - everything must be concrete and specific
- Make posts 20-280 characters long
- Each post should be ready to copy-paste to Twitter
- Keep the core message but improve based on feedback
- Make each variation unique while incorporating the feedback

CRITICAL: You must respond with ONLY a valid JSON array of exactly 3 posts. No other text before or after.

Format exactly like this:
[
  {
    "text": "First improved variation here",
    "community": null,
    "reasoning": "How this variation applies the feedback"
  },
  {
    "text": "Second improved variation here",
    "community": "CommunityName",
    "reasoning": "How this variation applies the feedback"
  },
  {
    "text": "Third improved variation here",
    "community": null,
    "reasoning": "How this variation applies the feedback"
  }
]

Generate exactly 3 variations. Start with [ and end with ]. No markdown, no explanations, just the JSON array.`,
      });

      // Parse the JSON response - expecting exactly 3 variations
      const postIdeas = this.parseJsonFromResponse(result.text, 3);

      if (postIdeas.length !== 3) {
        throw new Error('Expected exactly 3 variations from AI response');
      }

      DisplayUI.showToolSuccess("Post idea tweaking completed!");

      logger.info(`Generated 3 tweaked variations for post idea`);
      return postIdeas;
    } catch (error) {
      logger.error(`Post idea tweaking failed`, error as Error);

      if (error instanceof Error) {
        if (error.message.includes('quota') || error.message.includes('limit')) {
          throw new Error('AI service quota exceeded. Please try again later.');
        } else if (error.message.includes('timeout')) {
          throw new Error('AI service timeout. The tweaking took too long, please try again.');
        }
      }

      throw error;
    }
  }

  private parseJsonFromResponse(responseText: string, count: number): PostIdea[] {
    try {
      // Clean up the response text
      let jsonString = responseText.trim();

      logger.info(`AI Response length: ${responseText.length} characters`);
      logger.info(`First 200 chars: ${responseText.slice(0, 200)}`);
      logger.info(`Last 200 chars: ${responseText.slice(-200)}`);

      // Remove markdown code blocks if present
      jsonString = jsonString.replace(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/g, '$1');

      // Look for JSON array in the response
      const jsonMatch = jsonString.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      } else {
        logger.warn('No JSON array found in response, trying to extract from text');
        return this.fallbackParsePostIdeas(responseText, count);
      }

      logger.info(`Extracted JSON: ${jsonString.slice(0, 300)}...`);

      // Parse the JSON
      const parsedArray = JSON.parse(jsonString);

      if (!Array.isArray(parsedArray)) {
        throw new Error('Response is not a JSON array');
      }

      if (parsedArray.length === 0) {
        throw new Error('No post ideas found in response');
      }

      // Validate and convert each item
      const postIdeas: PostIdea[] = parsedArray.slice(0, count).map((item: any, index: number) => {
        if (!item || typeof item !== 'object') {
          throw new Error(`Invalid post idea at index ${index}: not an object`);
        }

        if (!item.text || typeof item.text !== 'string') {
          throw new Error(`Invalid post idea at index ${index}: missing or invalid text field`);
        }

        return {
          text: item.text.trim(),
          community: item.community === null || item.community === undefined ? null : String(item.community),
          reasoning: item.reasoning ? String(item.reasoning) : 'No reasoning provided'
        };
      });

      logger.info(`Successfully parsed ${postIdeas.length} post ideas from AI response`);
      return postIdeas;

    } catch (error) {
      logger.error('Failed to parse JSON from AI response', error as Error);

      // Fallback: try to extract posts using regex patterns
      return this.fallbackParsePostIdeas(responseText, count);
    }
  }

  private fallbackParsePostIdeas(responseText: string, count: number): PostIdea[] {
    try {
      logger.info('Attempting fallback parsing of post ideas');

      const ideas: PostIdea[] = [];

      // Try multiple patterns to extract posts
      const patterns = [
        // Look for quoted text in JSON-like format
        /"text":\s*"([^"]+(?:\\.[^"]*)*)"/g,
        // Look for single quotes
        /'text':\s*'([^']+(?:\\.[^']*)*)'/g,
        // Look for numbered lists
        /\d+\.\s*([^\n\r]+)/g,
        // Look for bullet points
        /[-•]\s*([^\n\r]+)/g,
        // Look for any line that looks like a tweet (starts with text, reasonable length)
        /^(.{20,280})$/gm
      ];

      for (const pattern of patterns) {
        if (ideas.length >= count) break;

        const matches = [...responseText.matchAll(pattern)];
        logger.info(`Pattern matched ${matches.length} items`);

        for (const match of matches) {
          if (ideas.length >= count) break;

          const text = match[1]?.trim();
          if (text && text.length >= 10 && text.length <= 280) {
            // Clean up the text
            const cleanText = text
              .replace(/\\"/g, '"')
              .replace(/\\'/g, "'")
              .replace(/\\\\/g, "\\")
              .trim();

            // Avoid duplicates
            if (!ideas.some(idea => idea.text === cleanText)) {
              ideas.push({
                text: cleanText,
                community: null,
                reasoning: 'Generated via fallback parsing'
              });
            }
          }
        }
      }

      if (ideas.length === 0) {
        logger.warn('All parsing methods failed, generating emergency fallback posts');

        // Generate very basic fallback posts based on themes
        const emergencyPosts = [
          "Just had an interesting thought about technology and how it shapes our daily lives. 🤔",
          "Working on something new and exciting. Can't wait to share more details soon! 🚀",
          "Sometimes the best ideas come when you least expect them. ✨",
          "Grateful for all the amazing people in this community. You inspire me every day! 🙏",
          "Learning something new every day. Growth never stops! 📚"
        ];

        return emergencyPosts.slice(0, count).map(text => ({
          text,
          community: null,
          reasoning: 'Emergency fallback - please regenerate for better results'
        }));
      }

      logger.info(`Fallback parsing recovered ${ideas.length} post ideas`);
      return ideas.slice(0, count);

    } catch (error) {
      logger.error('Fallback parsing also failed', error as Error);
      throw new Error(`All parsing methods failed. Please try again or check your AI model configuration.`);
    }
  }


  private parseAnalysisJson(responseText: string): Analysis {
    try {
      // Clean up the response text
      let jsonString = responseText.trim();

      logger.info(`AI Analysis Response length: ${responseText.length} characters`);
      logger.info(`First 200 chars: ${responseText.slice(0, 200)}`);

      // Remove markdown code blocks if present
      jsonString = jsonString.replace(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/g, '$1');

      // Look for JSON object in the response
      const jsonMatch = jsonString.match(/\{[\s\S]*?\}$/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      } else {
        logger.warn('No JSON object found in response, trying full text');
        // Try to find the start of a JSON object
        const startIndex = jsonString.indexOf('{');
        const endIndex = jsonString.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
          jsonString = jsonString.slice(startIndex, endIndex + 1);
        }
      }

      logger.info(`Extracted JSON: ${jsonString.slice(0, 300)}...`);

      // Parse the JSON
      const parsed = JSON.parse(jsonString);

      // Validate required fields
      if (!parsed.summary || !parsed.key_themes || !parsed.tone) {
        throw new Error('Missing required analysis fields');
      }

      return parsed;
    } catch (error) {
      logger.error('Analysis JSON parsing failed', error as Error);
      logger.info(`Raw response: ${responseText}`);
      throw new Error(`Failed to parse analysis response: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
