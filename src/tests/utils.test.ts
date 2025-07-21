import { describe, test, expect } from "bun:test";
import { Utils } from "../utils";
import type { UserData, Analysis } from "../types";

describe("Utils", () => {
  test("generatePostIdeasStats - should calculate stats correctly", () => {
    const postIdeas = [
      { text: "Short post", community: null, reasoning: "test" },
      { text: "A much longer post that exceeds the typical length and should be counted as long content for testing purposes", community: "Tech", reasoning: "test" },
      { text: "Medium length post with some content", community: "Tech", reasoning: "test" },
      { text: "Another post", community: null, reasoning: "test" }
    ];

    const stats = Utils.generatePostIdeasStats(postIdeas);

    expect(stats.total).toBe(4);
    expect(stats.averageLength).toBeGreaterThan(0);
    expect(stats.communities).toEqual(["Tech"]);
    expect(stats.withCommunity).toBe(2);
    expect(stats.withoutCommunity).toBe(2);
  });

  test("truncateText - should truncate text correctly", () => {
    expect(Utils.truncateText("Short", 10)).toBe("Short");
    expect(Utils.truncateText("This is a very long text", 10)).toBe("This is...");
  });

  test("generateUserDataStats - should calculate user stats correctly", () => {
    const analysis: Analysis = {
      summary: "Test summary",
      key_themes: ["tech", "coding"],
      engagement_patterns: ["morning posts"],
      unique_behaviors: ["uses emojis"],
      opportunities: ["more engagement"],
      tone: "friendly",
      content_taxonomy: ["posts", "threads", "replies"],
      thematic_analysis: ["technology trends", "coding tutorials"],
      untapped_opportunities: ["video content", "live streams"]
    };

    const userData: UserData = {
      username: "testuser",
      posts: [
        { text: "Test post 1" },
        { text: "Test post 2" }
      ],
      analysis,
      customInstructions: "Test instructions",
      availableCommunities: [
        { name: "Tech", description: "Technology community" }
      ],
      lastUpdated: new Date().toISOString()
    };

    const stats = Utils.generateUserDataStats(userData);

    expect(stats.totalPosts).toBe(2);
    expect(stats.hasAnalysis).toBe(true);
    expect(stats.hasCustomInstructions).toBe(true);
    expect(stats.communitiesCount).toBe(1);
    expect(stats.hasDetailedAnalysis).toBe(true);
    expect(stats.analysisCompleteness).toBeGreaterThan(5);
  });
});
