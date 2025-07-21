import { tool } from "ai";
import { z } from "zod";
import { tavily } from "@tavily/core";
import ora from "ora";

export const webSearch = tool({
  description: "Search the web for information",
  parameters: z.object({
    query: z.string(),
    max_results: z.number().optional().default(5),
  }),
  execute: async ({ query, max_results = 5 }) => {
    const spinner = ora({
      text: `Searching the web for "${query}"...`,
      color: 'blue'
    }).start();

    try {
      // Check if API key is configured
      const apiKey = process.env.TAVILY_API_KEY;
      if (!apiKey) {
        spinner.fail('Tavily API key not configured');
        throw new Error("Tavily API key not configured. Please set TAVILY_API_KEY environment variable.");
      }

      // Initialize Tavily client
      const client = tavily({ apiKey });

      // Perform search
      spinner.text = `Searching "${query}" (up to ${max_results} results)...`;
      const result = await client.search(query, {
        max_results,
        search_depth: "basic",
        include_answer: true,
        include_images: false,
        include_raw_content: false
      });

      // Format the results
      const searchResults = {
        query,
        answer: result.answer,
        results: result.results.map((item: any) => ({
          title: item.title,
          url: item.url,
          content: item.content,
          score: item.score
        }))
      };

      spinner.succeed(`Found ${result.results.length} search results for "${query}"`);
      return searchResults;
    } catch (error) {
      spinner.fail(`Web search failed for "${query}"`);
      throw new Error(`Web search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
