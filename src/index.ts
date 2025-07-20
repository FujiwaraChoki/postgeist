#!/usr/bin/env bun
import { PostgeistApp } from "./app";
import { DisplayUI } from "./ui/display";
import { Utils } from "./utils";
import chalk from "chalk";

// CLI argument parsing
interface CLIOptions {
  help?: boolean;
  version?: boolean;
  username?: string;
  action?: string;
  verbose?: boolean;
  setup?: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "-h":
      case "--help":
        options.help = true;
        break;
      case "-v":
      case "--version":
        options.version = true;
        break;
      case "-u":
      case "--username":
        options.username = args[++i];
        break;
      case "-a":
      case "--action":
        options.action = args[++i];
        break;
      case "--verbose":
        options.verbose = true;
        break;
      case "--setup":
        options.setup = true;
        break;
      default:
        // If it doesn't start with -, treat as username
        if (arg && !arg.startsWith("-") && !options.username) {
          options.username = arg;
        }
        break;
    }
  }

  return options;
}

function showHelp(): void {
  console.log(chalk.cyan.bold("🚀 Postgeist - AI-Powered Twitter Analysis & Content Generation\n"));

  console.log(chalk.white.bold("USAGE:"));
  console.log("  postgeist [options] [username]");
  console.log("  bun run src/index.ts [options] [username]\n");

  console.log(chalk.white.bold("OPTIONS:"));
  console.log("  -h, --help              Show this help message");
  console.log("  -v, --version           Show version information");
  console.log("  -u, --username <user>   Specify Twitter username to analyze");
  console.log("  -a, --action <action>   Specify action (analyze, ideas, both)");
  console.log("  --verbose               Enable verbose logging");
  console.log("  --setup                 Show setup instructions\n");

  console.log(chalk.white.bold("EXAMPLES:"));
  console.log("  postgeist elonmusk              # Analyze @elonmusk interactively");
  console.log("  postgeist -u elonmusk -a both   # Analyze and generate ideas");
  console.log("  postgeist --setup               # Show setup instructions\n");

  console.log(chalk.white.bold("ENVIRONMENT VARIABLES:"));
  console.log("  TWITTER_USERNAME    Your Twitter username");
  console.log("  TWITTER_PASSWORD    Your Twitter password");
  console.log("  TWITTER_EMAIL       Your Twitter email (optional)");
  console.log("  LOG_LEVEL          Log level (DEBUG, INFO, WARN, ERROR)");
  console.log("  DATA_DIR           Data directory (default: ~/.postgeist)\n");

  console.log(chalk.gray("For more information, visit: https://github.com/your-username/postgeist"));
}

async function showVersion(): Promise<void> {
  // Read version from package.json
  try {
    const packagePath = new URL("../../package.json", import.meta.url).pathname;
    const packageJson = JSON.parse(await Bun.file(packagePath).text());
    console.log(chalk.cyan.bold(`Postgeist v${packageJson.version || "0.1.0"}`));
  } catch {
    console.log(chalk.cyan.bold("Postgeist v0.1.0"));
  }
}

async function runNonInteractiveMode(app: any, options: CLIOptions): Promise<void> {
  try {
    const username = options.username!;

    // Handle different actions
    switch (options.action) {
      case "analyze":
        await app.analyzeUser(username);
        break;

      case "ideas":
        await app.generateForUser(username);
        break;

      case "both":
        await app.analyzeAndGenerate(username);
        break;

      default:
        // If no action specified but username provided, default to analyze and ideas
        await app.analyzeAndGenerate(username);
    }

    console.log(chalk.green("\n✅ Operation completed successfully!"));
  } catch (error) {
    console.error(chalk.red("❌ Error:"), (error as Error).message);
    process.exit(1);
  }
}

async function runCLI(options: CLIOptions): Promise<void> {
  if (options.help) {
    showHelp();
    return;
  }

  if (options.version) {
    await showVersion();
    return;
  }

  if (options.setup) {
    DisplayUI.showSetupHelp();
    return;
  }

  if (options.verbose) {
    process.env.LOG_LEVEL = "DEBUG";
  }

  // Validate environment if not showing help/version
  const envCheck = Utils.validateEnvironment();
  if (!envCheck.valid) {
    // In non-interactive mode, show a more concise error
    if (options.username || options.action) {
      console.error(chalk.red("❌ Twitter credentials not configured!"));
      console.log(chalk.yellow("Missing environment variables:"));
      envCheck.issues.forEach(issue => {
        console.log(chalk.red(`  • ${issue}`));
      });
      console.log(chalk.cyan("\nRun 'postgeist --setup' for detailed setup instructions."));
      process.exit(1);
    } else {
      // In interactive mode, show full setup help
      DisplayUI.showError("Environment setup required");
      DisplayUI.showSetupHelp();

      console.log(chalk.yellow("\nMissing:"));
      envCheck.issues.forEach(issue => {
        console.log(chalk.red(`  • ${issue}`));
      });

      console.log(chalk.cyan("\nRun 'postgeist --setup' for detailed setup instructions."));
      process.exit(1);
    }
  }

  // Run the application
  const app = new PostgeistApp();

  // Handle CLI arguments for non-interactive mode
  if (options.username || options.action) {
    await runNonInteractiveMode(app, options);
  } else {
    // Run in interactive mode
    await app.run();
  }
}

async function main(): Promise<void> {
  try {
    const options = parseArgs();
    await runCLI(options);
  } catch (error) {
    if (error instanceof Error && error.message.includes('SIGINT')) {
      console.log(chalk.yellow("\n\nOperation cancelled by user."));
      process.exit(0);
    }

    console.error(chalk.red("\n❌ Fatal error:"), error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow("\n\n👋 Goodbye!"));
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(chalk.yellow("\n\n👋 Goodbye!"));
  process.exit(0);
});

// Run the application
if (import.meta.main) {
  main();
}
