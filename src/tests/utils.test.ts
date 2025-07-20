import { test, expect, describe } from "bun:test";
import { Utils } from "../utils";
import type { PostIdea, UserData } from "../types";

describe("Utils", () => {
  describe("formatBytes", () => {
    test("should format bytes correctly", () => {
      expect(Utils.formatBytes(0)).toBe("0 B");
      expect(Utils.formatBytes(1024)).toBe("1 KB");
      expect(Utils.formatBytes(1048576)).toBe("1 MB");
      expect(Utils.formatBytes(1073741824)).toBe("1 GB");
    });
  });

  describe("sanitizeFilename", () => {
    test("should sanitize filename correctly", () => {
      expect(Utils.sanitizeFilename("hello world")).toBe("hello_world");
      expect(Utils.sanitizeFilename("test@user")).toBe("test_user");
      expect(Utils.sanitizeFilename("file/name")).toBe("file_name");
      expect(Utils.sanitizeFilename("Test__File")).toBe("test_file");
    });
  });

  describe("countWords", () => {
    test("should count words correctly", () => {
      expect(Utils.countWords("hello world")).toBe(2);
      expect(Utils.countWords("  hello   world  ")).toBe(2);
      expect(Utils.countWords("")).toBe(0);
      expect(Utils.countWords("single")).toBe(1);
    });
  });

  describe("truncateText", () => {
    test("should truncate text correctly", () => {
      expect(Utils.truncateText("hello world", 5)).toBe("he...");
      expect(Utils.truncateText("hello", 10)).toBe("hello");
      expect(Utils.truncateText("hello world", 11)).toBe("hello world");
    });
  });

  describe("extractHashtags", () => {
    test("should extract hashtags correctly", () => {
      expect(Utils.extractHashtags("Hello #world #test")).toEqual(["#world", "#test"]);
      expect(Utils.extractHashtags("No hashtags here")).toEqual([]);
      expect(Utils.extractHashtags("#single")).toEqual(["#single"]);
    });
  });

  describe("extractMentions", () => {
    test("should extract mentions correctly", () => {
      expect(Utils.extractMentions("Hello @user @test")).toEqual(["@user", "@test"]);
      expect(Utils.extractMentions("No mentions here")).toEqual([]);
      expect(Utils.extractMentions("@single")).toEqual(["@single"]);
    });
  });

  describe("generatePostIdeasStats", () => {
    test("should generate correct stats", () => {
      const postIdeas: PostIdea[] = [
        { text: "Hello world", community: "tech", reasoning: "test" },
        { text: "Another post", community: null },
        { text: "Third post", community: "general" }
      ];

      const stats = Utils.generatePostIdeasStats(postIdeas);

      expect(stats.total).toBe(3);
      expect(stats.withCommunity).toBe(2);
      expect(stats.withoutCommunity).toBe(1);
      expect(stats.communities).toEqual(["general", "tech"]);
      expect(stats.averageLength).toBeCloseTo(11, 1);
    });
  });

  describe("calculateUserStats", () => {
    test("should calculate user stats correctly", () => {
      const userData: UserData = {
        username: "test",
        posts: [
          { text: "post 1" },
          { text: "post 2" }
        ],
        analysis: {
          summary: "test",
          key_themes: [],
          engagement_patterns: [],
          unique_behaviors: [],
          opportunities: [],
          tone: "test"
        },
        customInstructions: "test instructions",
        availableCommunities: [{ name: "test", description: "test" }],
        randomFacts: ["fact 1", "fact 2", "fact 3"],
        lastUpdated: new Date().toISOString()
      };

      const stats = Utils.calculateUserStats(userData);

      expect(stats.totalPosts).toBe(2);
      expect(stats.hasAnalysis).toBe(true);
      expect(stats.hasCommunities).toBe(true);
      expect(stats.hasInstructions).toBe(true);
      expect(stats.hasRandomFacts).toBe(true);
      expect(stats.randomFactsCount).toBe(3);
      expect(stats.daysSinceUpdate).toBe(0);
    });
  });

  describe("isValidJSON", () => {
    test("should validate JSON correctly", () => {
      expect(Utils.isValidJSON('{"key": "value"}')).toBe(true);
      expect(Utils.isValidJSON("invalid json")).toBe(false);
      expect(Utils.isValidJSON("")).toBe(false);
      expect(Utils.isValidJSON("null")).toBe(true);
    });
  });

  describe("deepClone", () => {
    test("should deep clone objects", () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = Utils.deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
    });
  });
});
