import { tool } from "ai";
import { z } from "zod";
import { tavily } from "@tavily/core";

export const webSearch = tool({
  description: "Search the web for information",
  parameters: z.object({
    query: z.string(),
    max_results: z.number().optional().default(5),
  }),
  execute: async ({ query, max_results = 5 }) => {
    try {
      // Check if API key is configured
      const apiKey = process.env.TAVILY_API_KEY;
      if (!apiKey) {
        throw new Error("Tavily API key not configured. Please set TAVILY_API_KEY environment variable.");
      }

      // Initialize Tavily client
      const client = tavily({ apiKey });

      // Perform search
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

      return searchResults;
    } catch (error) {
      throw new Error(`Web search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
