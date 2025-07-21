import { serve } from "bun";
import { PostgeistApp } from "./src/app";
import { dataService } from "./src/services/data";
import { scraperService } from "./src/services/scraper";
import { aiService } from "./src/services/ai";
import { createLogger } from "./logger";
import type { UserData, PostIdea, Analysis, Community } from "./src/types";

const logger = createLogger("PostgeistAPI");

// Create a singleton instance of the app
const postgeistApp = new PostgeistApp();

// Helper function to handle CORS
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

// Helper function to create JSON response
function jsonResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}

// Helper function to handle errors
function errorResponse(message: string, status: number = 500) {
  logger.error(`API Error: ${message}`);
  return jsonResponse({ error: message }, status);
}

// API Routes
const routes = {
  // Health check
  "GET /health": () => {
    return jsonResponse({ status: "ok", service: "Postgeist API" });
  },

  // User management
  "GET /api/users": async () => {
    try {
      const users = await dataService.listUsers();
      const usersWithStats = await Promise.all(
        users.map(async (username) => {
          const userData = await dataService.getUserData(username);
          return {
            username,
            postsCount: userData.posts.length,
            hasAnalysis: !!userData.analysis,
            lastUpdated: userData.lastUpdated,
            customInstructions: !!userData.customInstructions,
            communities: userData.availableCommunities?.length || 0,
          };
        })
      );
      return jsonResponse(usersWithStats);
    } catch (error) {
      return errorResponse(`Failed to fetch users: ${error}`);
    }
  },

  "GET /api/users/:username": async (request: Request, params: Record<string, string>) => {
    try {
      const userData = await dataService.getUserData(params.username);
      return jsonResponse(userData);
    } catch (error) {
      return errorResponse(`Failed to fetch user data: ${error}`);
    }
  },

  "DELETE /api/users/:username": async (request: Request, params: Record<string, string>) => {
    try {
      const success = await dataService.deleteUserData(params.username);
      if (success) {
        return jsonResponse({ message: `User @${params.username} deleted successfully` });
      } else {
        return errorResponse("User not found", 404);
      }
    } catch (error) {
      return errorResponse(`Failed to delete user: ${error}`);
    }
  },

  // Twitter scraping
  "POST /api/scrape/:username": async (request: Request, params: Record<string, string>) => {
    try {
      const posts = await scraperService.fetchPosts(params.username);
      return jsonResponse({
        username: params.username,
        postsCount: posts.length,
        posts: posts.slice(0, 10), // Return first 10 posts for preview
      });
    } catch (error) {
      return errorResponse(`Failed to scrape posts: ${error}`);
    }
  },

  "POST /api/scrape/:username/refresh": async (request: Request, params: Record<string, string>) => {
    try {
      const posts = await scraperService.refreshPosts(params.username);
      return jsonResponse({
        username: params.username,
        postsCount: posts.length,
        posts: posts.slice(0, 10),
      });
    } catch (error) {
      return errorResponse(`Failed to refresh posts: ${error}`);
    }
  },

  // Analysis
  "POST /api/analyze/:username": async (request: Request, params: Record<string, string>) => {
    try {
      const userData = await dataService.getUserData(params.username);

      // Fetch posts if not available
      if (userData.posts.length === 0) {
        userData.posts = await scraperService.fetchPosts(params.username);
        await dataService.saveUserData(userData);
      }

      const analysis = await aiService.analyzeUser(params.username, userData.posts);
      userData.analysis = analysis;
      await dataService.saveUserData(userData);

      return jsonResponse({
        username: params.username,
        analysis,
        postsAnalyzed: userData.posts.length,
      });
    } catch (error) {
      return errorResponse(`Failed to analyze user: ${error}`);
    }
  },

  "GET /api/analysis/:username": async (request: Request, params: Record<string, string>) => {
    try {
      const userData = await dataService.getUserData(params.username);
      if (!userData.analysis) {
        return errorResponse("No analysis found. Please analyze the user first.", 404);
      }
      return jsonResponse({
        username: params.username,
        analysis: userData.analysis,
        postsAnalyzed: userData.posts.length,
      });
    } catch (error) {
      return errorResponse(`Failed to fetch analysis: ${error}`);
    }
  },

  // Post generation
  "POST /api/generate/:username": async (request: Request, params: Record<string, string>) => {
    try {
      const body = await request.json().catch(() => ({}));
      const count = body.count || 10;

      const userData = await dataService.getUserData(params.username);
      if (!userData.analysis) {
        return errorResponse("No analysis found. Please analyze the user first.", 400);
      }

      const postIdeas = await aiService.generatePostIdeas(userData, count);
      return jsonResponse({
        username: params.username,
        postIdeas,
        count: postIdeas.length,
      });
    } catch (error) {
      return errorResponse(`Failed to generate posts: ${error}`);
    }
  },

  // Settings management
  "GET /api/settings/:username": async (request: Request, params: Record<string, string>) => {
    try {
      const userData = await dataService.getUserData(params.username);
      return jsonResponse({
        username: params.username,
        customInstructions: userData.customInstructions,
        availableCommunities: userData.availableCommunities || [],
      });
    } catch (error) {
      return errorResponse(`Failed to fetch settings: ${error}`);
    }
  },

  "PUT /api/settings/:username/instructions": async (request: Request, params: Record<string, string>) => {
    try {
      const body = await request.json();
      const userData = await dataService.getUserData(params.username);
      userData.customInstructions = body.instructions;
      await dataService.saveUserData(userData);
      return jsonResponse({
        message: "Custom instructions updated successfully",
        instructions: userData.customInstructions
      });
    } catch (error) {
      return errorResponse(`Failed to update instructions: ${error}`);
    }
  },

  "POST /api/settings/:username/communities": async (request: Request, params: Record<string, string>) => {
    try {
      const body = await request.json();
      const userData = await dataService.getUserData(params.username);

      if (!userData.availableCommunities) {
        userData.availableCommunities = [];
      }

      userData.availableCommunities.push({
        name: body.name,
        description: body.description,
      });

      await dataService.saveUserData(userData);
      return jsonResponse({
        message: "Community added successfully",
        communities: userData.availableCommunities,
      });
    } catch (error) {
      return errorResponse(`Failed to add community: ${error}`);
    }
  },

  "DELETE /api/settings/:username/communities/:communityName": async (request: Request, params: Record<string, string>) => {
    try {
      const userData = await dataService.getUserData(params.username);

      if (!userData.availableCommunities) {
        return errorResponse("No communities found", 404);
      }

      const initialLength = userData.availableCommunities.length;
      userData.availableCommunities = userData.availableCommunities.filter(
        c => c.name !== params.communityName
      );

      if (userData.availableCommunities.length === initialLength) {
        return errorResponse("Community not found", 404);
      }

      await dataService.saveUserData(userData);
      return jsonResponse({
        message: "Community deleted successfully",
        communities: userData.availableCommunities,
      });
    } catch (error) {
      return errorResponse(`Failed to delete community: ${error}`);
    }
  },

  // Data management
  "GET /api/data/stats": async () => {
    try {
      const stats = await dataService.getDataStats();
      return jsonResponse(stats);
    } catch (error) {
      return errorResponse(`Failed to fetch data stats: ${error}`);
    }
  },

  "POST /api/export/:username": async (request: Request, params: Record<string, string>) => {
    try {
      const body = await request.json().catch(() => ({}));
      const format = body.format || 'json';

      const filePath = await dataService.exportUserData(params.username, format);
      return jsonResponse({
        message: "Data exported successfully",
        filePath,
        format,
      });
    } catch (error) {
      return errorResponse(`Failed to export data: ${error}`);
    }
  },

  // Auth status
  "GET /api/auth/status": () => {
    try {
      const status = scraperService.getAuthStatus();
      return jsonResponse(status);
    } catch (error) {
      return errorResponse(`Failed to get auth status: ${error}`);
    }
  },
};

// Route matching function
function matchRoute(method: string, path: string): { handler: Function; params: Record<string, string> } | null {
  for (const [route, handler] of Object.entries(routes)) {
    const [routeMethod, routePath] = route.split(' ');

    if (method !== routeMethod) continue;

    // Convert route path to regex pattern
    const paramNames: string[] = [];
    const pattern = routePath.replace(/:([^/]+)/g, (_, paramName) => {
      paramNames.push(paramName);
      return '([^/]+)';
    });

    const regex = new RegExp(`^${pattern}$`);
    const match = path.match(regex);

    if (match) {
      const params: Record<string, string> = {};
      paramNames.forEach((name, index) => {
        params[name] = match[index + 1];
      });

      return { handler, params };
    }
  }

  return null;
}

// Main server
const server = serve({
  port: process.env.PORT || 3001,
  async fetch(request) {
    const url = new URL(request.url);
    const { method } = request;

    // Handle CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders(),
      });
    }

    try {
      const route = matchRoute(method, url.pathname);

      if (route) {
        const { handler, params } = route;
        return await handler(request, params);
      }

      // Serve static files for frontend (if they exist)
      if (url.pathname.startsWith('/') && !url.pathname.startsWith('/api/')) {
        // Try to serve from frontend build directory
        try {
          const frontendPath = `./frontend/dist${url.pathname === '/' ? '/index.html' : url.pathname}`;
          const file = Bun.file(frontendPath);
          if (await file.exists()) {
            return new Response(file);
          }
        } catch {
          // Fall through to 404
        }
      }

      return jsonResponse({ error: "Not found" }, 404);
    } catch (error) {
      logger.error("Server error", error as Error);
      return errorResponse("Internal server error");
    }
  },
});

logger.info(`🚀 Postgeist API server running on http://localhost:${server.port}`);
logger.info("API endpoints:");
logger.info("  GET  /health - Health check");
logger.info("  GET  /api/users - List all users");
logger.info("  GET  /api/users/:username - Get user data");
logger.info("  POST /api/scrape/:username - Scrape user posts");
logger.info("  POST /api/analyze/:username - Analyze user");
logger.info("  POST /api/generate/:username - Generate post ideas");
logger.info("  GET  /api/settings/:username - Get user settings");
logger.info("  And more...");

export { server };
