import * as clack from "@clack/prompts";
import type {
  ActionType,
  SettingsActionType,
  CommunityActionType,
  InstructionsActionType,
  FactsActionType,
  Community,
  UserData
} from "../types";

export class PromptsUI {
  static async selectAction(): Promise<ActionType> {
    return await clack.select({
      message: "What would you like to do?",
      options: [
        { value: "analyze", label: "🔍 Analyze a Twitter Profile", hint: "Get AI insights and patterns" },
        { value: "ideas", label: "💡 Generate Post Ideas", hint: "From existing analysis" },
        { value: "both", label: "🚀 Analyze & Generate", hint: "Complete workflow" },
        { value: "info", label: "👤 View User Info", hint: "Show user data overview" },
        { value: "settings", label: "⚙️  Manage Settings", hint: "Custom instructions & communities" },
        { value: "data", label: "📊 Data Management", hint: "Export, import, and manage data" },
        { value: "exit", label: "👋 Exit", hint: "Goodbye!" }
      ]
    }) as ActionType;
  }

  static async getUsernameInput(): Promise<string> {
    return await clack.text({
      message: "Enter Twitter username (without @):",
      placeholder: "e.g., elonmusk",
      validate: (value) => {
        if (!value) return "Username is required";
        if (value.startsWith("@")) return "Don't include the @ symbol";
        if (value.length < 1) return "Username too short";
        if (value.length > 50) return "Username too long";
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return "Invalid characters. Use only letters, numbers, and underscores";
        return;
      }
    }) as string;
  }

  static async selectUser(users: string[]): Promise<string> {
    if (users.length === 0) {
      throw new Error("No users found");
    }

    return await clack.select({
      message: "Select a user:",
      options: users.map(user => ({
        value: user,
        label: `@${user}`,
        hint: "Previously analyzed user"
      }))
    }) as string;
  }

  static async selectSettingsAction(userData: UserData): Promise<SettingsActionType> {
    return await clack.select({
      message: `Settings for @${userData.username}`,
      options: [
        {
          value: "instructions",
          label: "📝 Custom Instructions",
          hint: userData.customInstructions ? "Edit existing instructions" : "Add new instructions"
        },
        {
          value: "communities",
          label: "🏘️  Communities",
          hint: `${userData.availableCommunities?.length || 0} configured`
        },
        {
          value: "facts",
          label: "🎯 Random Facts",
          hint: `${userData.analysis?.randomFacts?.length || 0} facts configured`
        },
        { value: "back", label: "⬅️  Back to Main Menu", hint: "Return to main menu" }
      ]
    }) as SettingsActionType;
  }

  static async selectCommunityAction(communities: Community[]): Promise<CommunityActionType> {
    return await clack.select({
      message: "Community Management",
      options: [
        { value: "view", label: "👀 View Communities", hint: `${communities.length} communities` },
        { value: "add", label: "➕ Add Community", hint: "Create new community" },
        ...(communities.length > 0 ? [{ value: "remove", label: "➖ Remove Community", hint: "Delete existing community" }] : []),
        { value: "back", label: "⬅️  Back to Settings", hint: "Return to settings menu" }
      ]
    }) as CommunityActionType;
  }

  static async selectInstructionsAction(hasInstructions: boolean): Promise<InstructionsActionType> {
    return await clack.select({
      message: "Custom Instructions Management",
      options: [
        { value: "view", label: "👀 View Current Instructions", hint: hasInstructions ? "See current" : "None set" },
        { value: "edit", label: "✏️  Edit Instructions", hint: hasInstructions ? "Modify existing" : "Add new" },
        ...(hasInstructions ? [{ value: "clear", label: "🗑️  Clear Instructions", hint: "Remove all instructions" }] : []),
        { value: "back", label: "⬅️  Back to Settings", hint: "Return to settings menu" }
      ]
    }) as InstructionsActionType;
  }

  static async getCustomInstructions(currentInstructions?: string): Promise<string> {
    const fs = await import('fs');
    const path = await import('path');
    const { execSync } = await import('child_process');
    const os = await import('os');

    // Create a temporary file for vim editing
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `postgeist-instructions-${Date.now()}.txt`);

    try {
      // Write current instructions to temp file, or helpful template if none exist
      const initialContent = currentInstructions || `# Custom Instructions for Post Generation
#
# Enter your custom instructions below. These will guide how AI generates posts for you.
# Examples:
# - Always mention learning in public
# - Never use more than 1 emoji per post
# - Focus on technical content
# - Keep posts under 280 characters
# - Always include a call to action
# - Use a professional but friendly tone
#
# Lines starting with # are comments and will be ignored.
# Delete this template and write your own instructions:

`;

      fs.writeFileSync(tempFile, initialContent);

      console.log('\n📝 Opening vim to edit your custom instructions...');
      console.log('💡 Save and quit with :wq when done, or :q! to cancel');

      // Open vim with the temp file
      execSync(`vim "${tempFile}"`, {
        stdio: 'inherit',
        encoding: 'utf8'
      });

      // Read the edited content
      const editedContent = fs.readFileSync(tempFile, 'utf8');

      // Clean up the content (remove comments and empty lines)
      const cleanedContent = editedContent
        .split('\n')
        .filter(line => !line.trim().startsWith('#') && line.trim().length > 0)
        .join('\n')
        .trim();

      if (!cleanedContent || cleanedContent.length === 0) {
        throw new Error('Instructions cannot be empty. Please provide some guidance for post generation.');
      }

      if (cleanedContent.length > 1000) {
        throw new Error('Instructions too long (max 1000 characters). Please shorten your instructions.');
      }

      return cleanedContent;

    } finally {
      // Clean up temp file
      try {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  static async getCommunityName(existingNames: string[] = []): Promise<string> {
    return await clack.text({
      message: "Community name:",
      placeholder: "e.g., Tech Founders",
      validate: (value) => {
        if (!value || value.trim().length === 0) return "Name is required";
        if (value.length > 50) return "Name too long (max 50 characters)";
        if (existingNames.some(name => name.toLowerCase() === value.toLowerCase())) {
          return "A community with this name already exists";
        }
        return;
      }
    }) as string;
  }

  static async getCommunityDescription(): Promise<string> {
    return await clack.text({
      message: "Community description:",
      placeholder: "e.g., Discussions about building and scaling tech startups",
      validate: (value) => {
        if (!value || value.trim().length === 0) return "Description is required";
        if (value.length > 200) return "Description too long (max 200 characters)";
        return;
      }
    }) as string;
  }

  static async selectCommunityToRemove(communities: Community[]): Promise<number> {
    const selected = await clack.select({
      message: "Select community to remove:",
      options: communities.map((community, index) => ({
        value: index.toString(),
        label: community.name,
        hint: community.description
      }))
    }) as string;

    return parseInt(selected);
  }

  static async confirmAction(message: string): Promise<boolean> {
    const result = await clack.confirm({
      message
    });

    if (clack.isCancel(result)) {
      return false;
    }

    return result;
  }

  static async selectDataAction(): Promise<string> {
    return await clack.select({
      message: "Data Management",
      options: [
        { value: "stats", label: "📈 View Statistics", hint: "Show data usage stats" },
        { value: "export", label: "📤 Export Data", hint: "Export user data" },
        { value: "cleanup", label: "🧹 Cleanup Data", hint: "Remove old or unused data" },
        { value: "list", label: "📋 List Users", hint: "Show all analyzed users" },
        { value: "back", label: "⬅️  Back to Main Menu", hint: "Return to main menu" }
      ]
    }) as string;
  }

  static async selectExportFormat(): Promise<'json' | 'csv'> {
    return await clack.select({
      message: "Select export format:",
      options: [
        { value: "json", label: "📄 JSON", hint: "Complete data export" },
        { value: "csv", label: "📊 CSV", hint: "Posts only, spreadsheet friendly" }
      ]
    }) as 'json' | 'csv';
  }

  static async selectPostCount(): Promise<number> {
    const count = await clack.select({
      message: "How many post ideas would you like?",
      options: [
        { value: "5", label: "5 posts", hint: "Quick batch" },
        { value: "10", label: "10 posts", hint: "Standard batch (recommended)" },
        { value: "15", label: "15 posts", hint: "Large batch" },
        { value: "20", label: "20 posts", hint: "Extra large batch" },
        { value: "custom", label: "Custom number", hint: "Specify your own count" }
      ]
    }) as string;

    if (count === "custom") {
      const customCount = await clack.text({
        message: "Enter number of posts (1-50):",
        placeholder: "10",
        validate: (value) => {
          const num = parseInt(value);
          if (isNaN(num)) return "Please enter a valid number";
          if (num < 1) return "Must be at least 1";
          if (num > 50) return "Maximum 50 posts";
          return;
        }
      }) as string;
      return parseInt(customCount);
    }

    return parseInt(count);
  }

  static async shouldContinue(): Promise<boolean> {
    const result = await clack.confirm({
      message: "Would you like to perform another action?"
    });

    if (clack.isCancel(result)) {
      return false;
    }

    return result;
  }

  static async selectFromList<T>(
    message: string,
    items: T[],
    labelFn: (item: T) => string,
    hintFn?: (item: T) => string
  ): Promise<T> {
    const options = items.map((item, index) => ({
      value: index.toString(),
      label: labelFn(item),
      hint: hintFn ? hintFn(item) : undefined
    }));

    const selected = await clack.select({
      message,
      options
    }) as string;

    if (clack.isCancel(selected)) {
      throw new Error('Selection cancelled');
    }

    const index = parseInt(selected);
    const item = items[index];
    if (!item) {
      throw new Error('Invalid selection');
    }

    return item;
  }

  // Spinner helpers for consistent loading states
  static createSpinner() {
    return clack.spinner();
  }

  // Input validation helpers
  static validateUsername(username: string): string | undefined {
    if (!username) return "Username is required";
    if (username.startsWith("@")) return "Don't include the @ symbol";
    if (username.length < 1) return "Username too short";
    if (username.length > 50) return "Username too long";
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return "Invalid characters. Use only letters, numbers, and underscores";
    return;
  }

  static validateNonEmpty(value: string, fieldName: string): string | undefined {
    if (!value || value.trim().length === 0) return `${fieldName} is required`;
    return;
  }

  static validateLength(value: string, maxLength: number, fieldName: string): string | undefined {
    if (value.length > maxLength) return `${fieldName} too long (max ${maxLength} characters)`;
    return;
  }

  // Random Facts Management
  static async selectFactsAction(facts: string[]): Promise<FactsActionType> {
    return await clack.select({
      message: "Random Facts Management",
      options: [
        { value: "view", label: "👀 View Random Facts", hint: `${facts.length} facts available` },
        { value: "regenerate", label: "🔄 Regenerate Facts", hint: "Re-analyze to generate new facts" },
        { value: "back", label: "⬅️  Back to Settings", hint: "Return to settings menu" }
      ]
    }) as FactsActionType;
  }
}
