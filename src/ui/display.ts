import chalk from "chalk";
import boxen from "boxen";
import type { Analysis, PostIdea, UserData } from "../types";

export class DisplayUI {
  static showWelcomeScreen(): void {
    console.clear();

    const welcomeMessage = boxen(
      chalk.cyan.bold("🚀 POSTGEIST") + "\n\n" +
      chalk.white("AI-Powered Twitter Analysis & Content Generation") + "\n" +
      chalk.gray("Analyze Twitter profiles and generate engaging post ideas") + "\n\n" +
      chalk.dim("Open Source • Made for Developers • Powered by AI"),
      {
        padding: 2,
        margin: 1,
        borderStyle: "round",
        borderColor: "cyan",
        backgroundColor: "#1a1a1a"
      }
    );

    console.log(welcomeMessage);
  }

  static showAnalysis(analysis: Analysis, username: string): void {
    console.log("\n" + boxen(
      chalk.cyan.bold(`📊 Analysis Results for @${username}`) + "\n\n" +
      chalk.white.bold("Summary:") + "\n" +
      chalk.gray(analysis.summary) + "\n\n" +
      chalk.white.bold("Key Themes:") + "\n" +
      analysis.key_themes.map(theme => chalk.yellow(`• ${theme}`)).join("\n") + "\n\n" +
      chalk.white.bold("Engagement Patterns:") + "\n" +
      analysis.engagement_patterns.map(pattern => chalk.green(`• ${pattern}`)).join("\n") + "\n\n" +
      chalk.white.bold("Unique Behaviors:") + "\n" +
      analysis.unique_behaviors.map(behavior => chalk.blue(`• ${behavior}`)).join("\n") + "\n\n" +
      chalk.white.bold("Growth Opportunities:") + "\n" +
      analysis.opportunities.map(opp => chalk.magenta(`• ${opp}`)).join("\n"),
      {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "green"
      }
    ));
  }

  static showPostIdeas(postIdeas: PostIdea[]): void {
    // Calculate stats
    const stats = this.calculatePostStats(postIdeas);

    // Create clean header
    const header = chalk.cyan.bold("💡 Generated Post Ideas") + chalk.gray(` (${postIdeas.length} ideas)`);
    const statsLine = this.formatStatsLine(stats);

    let content = header + "\n" + chalk.dim(statsLine) + "\n\n";

    // Group posts by community for better organization
    const grouped = this.groupPostsByCommunity(postIdeas);

    // Display posts by community groups
    let postIndex = 1;
    for (const [community, posts] of grouped) {
      if (grouped.size > 1) {
        // Show community header if there are multiple communities
        const communityHeader = community === "No Community"
          ? chalk.gray.bold("📝 General Posts")
          : chalk.blue.bold(`🏘️  ${community}`);
        content += communityHeader + chalk.gray(` (${posts.length} posts)`) + "\n\n";
      }

      // Display posts in this community
      for (const idea of posts) {
        content += this.formatPostIdea(idea, postIndex);

        // Add a visual separator between posts (except for the last one)
        if (postIndex < postIdeas.length) {
          content += chalk.dim("┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈") + "\n\n";
        }

        postIndex++;
      }

      // Add spacing between community groups
      if (grouped.size > 1 && community !== Array.from(grouped.keys()).pop()) {
        content += "\n";
      }
    }

    // Add action hints
    content += chalk.dim("─────────────────────────────────────────────────────────────────────────────────") + "\n";
    content += chalk.cyan("💡 Quick Actions: ") +
      chalk.gray("📋 Copy post") + chalk.dim(" • ") +
      chalk.gray("📁 Export all") + chalk.dim(" • ") +
      chalk.gray("📊 View stats") + chalk.dim(" • ") +
      chalk.gray("➡️  Continue");

    try {
      console.log("\n" + boxen(content, {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "yellow"
      }));
    } catch (error) {
      // Fallback if boxen fails - just print the content without the box
      console.log("\n" + content + "\n");
    }
  }

  static showPostIdeasCompact(postIdeas: PostIdea[]): void {
    // Calculate stats
    const stats = this.calculatePostStats(postIdeas);

    // Create clean header
    const header = chalk.cyan.bold("💡 Generated Post Ideas") + chalk.gray(` (${postIdeas.length} ideas - compact)`);
    const statsLine = this.formatStatsLine(stats);

    let content = header + "\n" + chalk.dim(statsLine) + "\n\n";

    // Display posts in compact format
    postIdeas.forEach((idea, i) => {
      const postNum = i + 1;
      const charCount = idea.text.length;
      const charColor = charCount > 280 ? 'red' : charCount > 240 ? 'yellow' : 'green';

      const communityBadge = idea.community
        ? chalk.blue(`[${idea.community}]`)
        : chalk.gray(`[Gen]`);

      const preview = this.truncateText(idea.text, 45);

      // Create X.com compose URL
      const encodedText = encodeURIComponent(idea.text);
      const twitterUrl = `https://x.com/intent/tweet?text=${encodedText}`;
      const clickableLink = this.createTerminalHyperlink(twitterUrl, chalk.cyan(`🔗 Open in X`));

      const postContent = chalk.white.bold(`${postNum}.`) + " " +
        chalk.gray(`${preview}`) + "\n" +
        chalk.dim(`${communityBadge} • ${chalk[charColor](`${charCount}c`)} • ${clickableLink}`);

      content += postContent + "\n\n";
    });

    // Add simple action hints
    content += "\n" + chalk.dim("💡 Actions: Detailed view • Copy post • Export all • Stats");

    try {
      console.log("\n" + boxen(content, {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "cyan"
      }));
    } catch (error) {
      // Fallback if boxen fails - just print the content without the box
      console.log("\n" + content + "\n");
    }
  }

  static async showPostIdeasWithViewOption(postIdeas: PostIdea[], defaultView: 'detailed' | 'compact' = 'detailed'): Promise<void> {
    if (defaultView === 'compact') {
      this.showPostIdeasCompact(postIdeas);
    } else {
      this.showPostIdeas(postIdeas);
    }
  }

  private static calculatePostStats(postIdeas: PostIdea[]) {
    const withCommunity = postIdeas.filter(p => p.community).length;
    const avgLength = Math.round(postIdeas.reduce((sum, p) => sum + p.text.length, 0) / postIdeas.length);
    const communities = [...new Set(postIdeas.map(p => p.community).filter(Boolean))];
    const hasHashtags = postIdeas.filter(p => p.text.includes('#')).length;
    const hasMentions = postIdeas.filter(p => p.text.includes('@')).length;

    return {
      total: postIdeas.length,
      withCommunity,
      withoutCommunity: postIdeas.length - withCommunity,
      avgLength,
      communities,
      hasHashtags,
      hasMentions
    };
  }

  private static formatStatsLine(stats: any): string {
    const items = [
      chalk.yellow(`${stats.total} posts`),
      chalk.blue(`${stats.avgLength} avg chars`),
    ];

    if (stats.withCommunity > 0) {
      items.push(chalk.green(`${stats.withCommunity} with community`));
    }

    if (stats.hasHashtags > 0) {
      items.push(chalk.magenta(`${stats.hasHashtags} with hashtags`));
    }

    if (stats.hasMentions > 0) {
      items.push(chalk.cyan(`${stats.hasMentions} with mentions`));
    }

    return items.join(chalk.dim(" • "));
  }

  private static groupPostsByCommunity(postIdeas: PostIdea[]): Map<string, PostIdea[]> {
    const grouped = new Map<string, PostIdea[]>();

    postIdeas.forEach(idea => {
      const community = idea.community || "No Community";
      if (!grouped.has(community)) {
        grouped.set(community, []);
      }
      grouped.get(community)!.push(idea);
    });

    // Sort communities: "No Community" last, others alphabetically
    const sortedEntries = Array.from(grouped.entries()).sort(([a], [b]) => {
      if (a === "No Community") return 1;
      if (b === "No Community") return -1;
      return a.localeCompare(b);
    });

    return new Map(sortedEntries);
  }

  private static formatPostIdea(idea: PostIdea, index: number): string {
    const charCount = idea.text.length;
    const charColor = charCount > 280 ? 'red' : charCount > 240 ? 'yellow' : 'green';

    // Simple post number
    const postHeader = chalk.white.bold(`Post ${index}`);

    // Highlight mentions and hashtags in post text
    const formattedText = this.highlightPostText(idea.text);

    // Compact metadata line
    const communityBadge = idea.community ? chalk.blue(idea.community) : chalk.gray("General");
    const charDisplay = chalk[charColor](`${charCount} chars`);
    const metadata = chalk.dim(`${communityBadge} • ${charDisplay}`);

    // Create X.com compose URL with pre-filled text
    const encodedText = encodeURIComponent(idea.text);
    const twitterUrl = `https://x.com/intent/tweet?text=${encodedText}`;
    const clickableLink = this.createTerminalHyperlink(twitterUrl, chalk.cyan(`🔗 Open in X`));

    return `${postHeader}\n` +
      `${formattedText}\n\n` +
      chalk.dim(`${metadata} • ${clickableLink}\n`);
  }

  private static highlightPostText(text: string): string {
    // Break long lines for better readability
    const maxLineLength = 75;
    let formattedText = text;

    // Highlight hashtags in magenta
    formattedText = formattedText.replace(/#(\w+)/g, chalk.magenta('#$1'));

    // Highlight mentions in cyan
    formattedText = formattedText.replace(/@(\w+)/g, chalk.cyan('@$1'));

    // Highlight URLs in blue
    formattedText = formattedText.replace(/(https?:\/\/\S+)/g, chalk.blue('$1'));

    if (text.length <= maxLineLength) {
      return formattedText;
    }

    // Word wrap for long posts
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).length > maxLineLength && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    // Re-apply highlighting to wrapped text
    return lines.map((line, i) => {
      const highlightedLine = line
        .replace(/#(\w+)/g, chalk.magenta('#$1'))
        .replace(/@(\w+)/g, chalk.cyan('@$1'))
        .replace(/(https?:\/\/\S+)/g, chalk.blue('$1'));
      return i === 0 ? highlightedLine : `   ${highlightedLine}`;
    }).join('\n');
  }

  private static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + "...";
  }

  private static createTerminalHyperlink(url: string, text: string): string {
    // OSC 8 hyperlink format: \e]8;;URL\e\\TEXT\e]8;;\e\\
    const osc8Start = '\x1b]8;;';
    const osc8End = '\x1b\\';
    return `${osc8Start}${url}${osc8End}${text}${osc8Start}${osc8End}`;
  }

  static showUserInfo(userData: UserData): void {
    const customInstructionsInfo = userData.customInstructions
      ? chalk.green("✓ Custom instructions set")
      : chalk.gray("✗ No custom instructions");

    const communitiesInfo = userData.availableCommunities && userData.availableCommunities.length > 0
      ? chalk.green(`✓ ${userData.availableCommunities.length} communities available`)
      : chalk.gray("✗ No communities set");

    const randomFactsInfo = userData.randomFacts && userData.randomFacts.length > 0
      ? chalk.green(`✓ ${userData.randomFacts.length} random facts configured`)
      : chalk.gray("✗ No random facts set");

    const analysisInfo = userData.analysis
      ? chalk.green("✓ Analysis available")
      : chalk.gray("✗ Not analyzed");

    console.log("\n" + boxen(
      chalk.cyan.bold(`👤 User: @${userData.username}`) + "\n\n" +
      chalk.white.bold("Data Overview:") + "\n" +
      chalk.yellow(`• Posts: ${userData.posts.length}`) + "\n" +
      chalk.yellow(`• Analysis: ${analysisInfo}`) + "\n" +
      chalk.yellow(`• ${customInstructionsInfo}`) + "\n" +
      chalk.yellow(`• ${communitiesInfo}`) + "\n" +
      chalk.yellow(`• ${randomFactsInfo}`) + "\n" +
      chalk.gray(`• Last updated: ${new Date(userData.lastUpdated).toLocaleString()}`),
      {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "blue"
      }
    ));

    // Show available communities if they exist
    if (userData.availableCommunities && userData.availableCommunities.length > 0) {
      this.showCommunities(userData.availableCommunities);
    }

    // Show custom instructions if they exist
    if (userData.customInstructions) {
      this.showCustomInstructions(userData.customInstructions);
    }

    // Show random facts if they exist
    if (userData.randomFacts && userData.randomFacts.length > 0) {
      this.showRandomFacts(userData.randomFacts);
    }
  }

  static showCommunities(communities: Array<{ name: string; description: string }>): void {
    console.log("\n" + boxen(
      chalk.cyan.bold("🏘️  Available Communities") + "\n\n" +
      communities.map(community =>
        chalk.white.bold(`• ${community.name}`) + "\n" +
        chalk.gray(`  ${community.description}`)
      ).join("\n\n"),
      {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "green"
      }
    ));
  }

  static showCustomInstructions(instructions: string): void {
    console.log("\n" + boxen(
      chalk.cyan.bold("📝 Custom Instructions") + "\n\n" +
      chalk.gray(instructions),
      {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "magenta"
      }
    ));
  }

  static showRandomFacts(facts: string[]): void {
    console.log("\n" + boxen(
      chalk.cyan.bold("🎯 Random Facts") + "\n\n" +
      facts.map((fact, index) =>
        chalk.white(`${index + 1}. `) + chalk.gray(fact)
      ).join("\n"),
      {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "yellow"
      }
    ));
  }

  static showDataStats(stats: { totalUsers: number; totalDataSize: string; lastUpdated?: string }): void {
    console.log("\n" + boxen(
      chalk.cyan.bold("📈 Data Statistics") + "\n\n" +
      chalk.white.bold("Overview:") + "\n" +
      chalk.yellow(`• Total Users: ${stats.totalUsers}`) + "\n" +
      chalk.yellow(`• Data Size: ${stats.totalDataSize}`) + "\n" +
      (stats.lastUpdated ? chalk.gray(`• Last Updated: ${new Date(stats.lastUpdated).toLocaleString()}`) : ""),
      {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "cyan"
      }
    ));
  }

  static showError(message: string, error?: Error): void {
    console.log("\n" + boxen(
      chalk.red.bold("❌ Error") + "\n\n" +
      chalk.white(message) +
      (error && process.env.NODE_ENV === 'development' ?
        "\n\n" + chalk.dim(error.stack || error.message) : ""),
      {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "red"
      }
    ));
  }

  static showSuccess(message: string): void {
    console.log("\n" + boxen(
      chalk.green.bold("✅ Success") + "\n\n" +
      chalk.white(message),
      {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "green"
      }
    ));
  }

  static showWarning(message: string): void {
    console.log("\n" + boxen(
      chalk.yellow.bold("⚠️  Warning") + "\n\n" +
      chalk.white(message),
      {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "yellow"
      }
    ));
  }

  static showInfo(message: string): void {
    console.log("\n" + boxen(
      chalk.blue.bold("ℹ️  Information") + "\n\n" +
      chalk.white(message),
      {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "blue"
      }
    ));
  }

  static showSetupHelp(): void {
    console.log("\n" + boxen(
      chalk.cyan.bold("��️  Setup Required") + "\n\n" +
      chalk.white("To use Postgeist, you need to configure your Twitter credentials:") + "\n\n" +
      chalk.yellow("1. Create a .env file in your project root") + "\n" +
      chalk.yellow("2. Add your Twitter credentials:") + "\n\n" +
      chalk.gray("   TWITTER_USERNAME=your_username") + "\n" +
      chalk.gray("   TWITTER_PASSWORD=your_password") + "\n" +
      chalk.gray("   TWITTER_EMAIL=your_email@example.com") + "\n\n" +
      chalk.blue.bold("📁 Data Storage:") + "\n" +
      chalk.blue("• User data will be stored in ~/.postgeist/") + "\n" +
      chalk.blue("• All data stays on your local machine") + "\n\n" +
      chalk.red.bold("⚠️  Security Notice:") + "\n" +
      chalk.red("• Never commit .env files to version control") + "\n" +
      chalk.red("• Use strong, unique passwords") + "\n" +
      chalk.red("• Be aware of Twitter's Terms of Service"),
      {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "cyan"
      }
    ));
  }
}
