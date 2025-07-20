# 🚀 Postgeist

AI-Powered Twitter Analysis & Content Generation Tool

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)

Postgeist analyzes Twitter profiles using AI to understand posting patterns, engagement styles, and content themes, then generates personalized post ideas that match the user's unique voice and style.

## ✨ Features

- **🧠 AI-Powered Analysis**: Deep analysis of Twitter profiles using Google Gemini
- **💡 Content Generation**: Generate post ideas that match your unique style
- **🏘️ Community Management**: Organize posts by communities or topics
- **📝 Custom Instructions**: Add personalized guidelines for content generation
- **📊 Data Management**: Export, import, and manage your analysis data
- **🎨 Beautiful CLI**: Interactive command-line interface with rich formatting
- **⚡ Fast & Efficient**: Built with Bun for optimal performance
- **🔒 Privacy-First**: All data stored locally on your machine

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) runtime (v1.0.0 or higher)
- Valid Twitter account credentials

### Installation

#### Option 1: Install Binary (Recommended)

**One-liner installation (macOS/Linux):**
```bash
curl -fsSL https://raw.githubusercontent.com/your-username/postgeist/main/scripts/install.sh | bash
```

**Manual installation:**
```bash
# Clone the repository
git clone https://github.com/your-username/postgeist.git
cd postgeist

# Install dependencies
bun install

# Run the installer
./scripts/install.sh
```

This will:
- Detect your platform automatically
- Build the appropriate binary
- Install `postgeist` to `/usr/local/bin`
- Make it available globally in your terminal

**Usage after binary installation:**
```bash
# Set up your environment
postgeist --setup

# Run the application
postgeist

# Show help
postgeist --help
```

#### Option 2: Development Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/postgeist.git
cd postgeist
```

2. Install dependencies:
```bash
bun install
```

3. Set up your environment:
```bash
bun run setup
```

4. Run Postgeist:
```bash
bun start
```

### Environment Setup

Create a `.env` file with your Twitter credentials:
```env
TWITTER_USERNAME=your_twitter_username
TWITTER_PASSWORD=your_twitter_password
TWITTER_EMAIL=your_email@example.com
```

**🔒 Important:** Never commit your `.env` file to version control!

## 🛠️ Usage

### Interactive Mode (Recommended)

```bash
bun start
```

This launches the interactive CLI where you can:
- Analyze Twitter profiles
- Generate post ideas
- Manage settings and communities
- Export and manage data

### Command Line Interface

```bash
# Analyze a specific user
bun start username

# Show help
bun start --help

# Show setup instructions
bun start --setup

# Enable verbose logging
bun start --verbose
```

### Available Commands

#### Development Commands
| Command | Description |
|---------|-------------|
| `bun start` | Launch interactive mode |
| `bun run dev` | Development mode with auto-restart |
| `bun run test` | Run tests |
| `bun run lint` | Run ESLint |
| `bun run format` | Format code with Prettier |
| `bun run typecheck` | Type check with TypeScript |
| `bun run clean` | Clean build and data files |

#### Build Commands
| Command | Description |
|---------|-------------|
| `bun run build` | Build for production |
| `bun run build:binary` | Build binary for current platform |
| `bun run build:all` | Build binaries for all platforms |
| `bun run build:linux` | Build binary for Linux |
| `bun run build:macos` | Build binary for macOS (Intel) |
| `bun run build:macos-arm` | Build binary for macOS (Apple Silicon) |
| `bun run build:windows` | Build binary for Windows |

#### Installation Commands
| Command | Description |
|---------|-------------|
| `./scripts/install.sh` | Install binary to system |
| `./scripts/install.sh --uninstall` | Uninstall from system |
| `./scripts/install.sh --help` | Show installer help |

## 📖 How It Works

1. **Authentication**: Postgeist authenticates with Twitter using your credentials
2. **Data Fetching**: Scrapes recent tweets from the target profile
3. **AI Analysis**: Uses Google Gemini to analyze posting patterns, themes, and style
4. **Content Generation**: Generates new post ideas that match the analyzed style
5. **Community Assignment**: Assigns posts to relevant communities (if configured)

## 🏗️ Project Structure

```
postgeist/
├── src/
│   ├── types/           # TypeScript type definitions
│   ├── config/          # Configuration management
│   ├── services/        # Business logic services
│   │   ├── data.ts      # Data management
│   │   ├── scraper.ts   # Twitter scraping
│   │   └── ai.ts        # AI analysis & generation
│   ├── ui/              # User interface components
│   │   ├── display.ts   # Display formatting
│   │   └── prompts.ts   # Interactive prompts
│   ├── utils/           # Utility functions
│   ├── app.ts           # Main application class
│   └── index.ts         # CLI entry point
├── data/                # Local data storage
├── logger.ts            # Logging system
├── prompts.ts           # AI prompts
├── x.ts                 # Twitter scraper wrapper
└── package.json
```

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TWITTER_USERNAME` | Yes | Your Twitter username |
| `TWITTER_PASSWORD` | Yes | Your Twitter password |
| `TWITTER_EMAIL` | No | Your Twitter email (recommended) |
| `LOG_LEVEL` | No | Log level (DEBUG, INFO, WARN, ERROR) |
| `DATA_DIR` | No | Data directory (default: ~/.postgeist) |
| `MAX_POSTS_TO_ANALYZE` | No | Maximum posts to analyze (default: 400) |
| `MAX_POSTS_FOR_PROMPT` | No | Maximum posts for AI prompts (default: 50) |

### Custom Instructions

Add personalized guidelines for content generation:

```
Examples:
- Always mention learning in public
- Never use more than 1 emoji per post
- Focus on technical content
- Keep posts under 280 characters
```

### Communities

Organize your posts by topics or communities:

- **Tech Founders**: Discussions about building startups
- **Dev Community**: Programming and development topics
- **AI/ML**: Artificial intelligence and machine learning

## 📊 Data Management

### Data Storage Location

Postgeist stores all user data locally in `~/.postgeist/` including:
- Twitter post cache (`username.json`)
- Analysis results
- Custom instructions
- Community configurations

### Data Operations

- **Export**: Save analysis and posts in JSON or CSV format
- **Import**: Load previously exported data
- **Cleanup**: Remove old or unused data
- **Statistics**: View usage statistics and insights

### Manual Data Management

```bash
# View your data directory
ls ~/.postgeist

# Check data size
du -sh ~/.postgeist

# Backup your data
cp -r ~/.postgeist ~/postgeist-backup

# Clear all data (be careful!)
rm -rf ~/.postgeist
```

## 📋 Logging

Postgeist maintains clean terminal output by logging detailed information to files:

- **Log Location**: `~/.postgeist/logs/`
- **Log Files**: Daily log files named `postgeist-YYYY-MM-DD.log`
- **Console Output**: Only warnings and errors appear in terminal
- **File Logging**: All activity (DEBUG, INFO, WARN, ERROR) logged to files

To view recent logs:
```bash
# View today's log
tail -f ~/.postgeist/logs/postgeist-$(date +%Y-%m-%d).log

# View all logs
ls ~/.postgeist/logs/
```

## 🔒 Security & Privacy

- **Local Storage**: All data is stored locally on your machine
- **No External Services**: Analysis data never leaves your computer
- **Credential Safety**: Environment variables keep credentials secure
- **No Tracking**: No analytics or tracking of any kind

## 🚨 Important Notes

- **Rate Limiting**: Respects Twitter's rate limits to avoid account issues
- **Terms of Service**: Be aware of Twitter's Terms of Service regarding automation
- **Account Security**: Use strong, unique passwords and consider 2FA
- **Responsible Use**: Use this tool responsibly and ethically

## 🔧 Binary Installation & Management

### Building Binaries

Build a binary for your current platform:
```bash
bun run build:binary
```

Build binaries for all supported platforms:
```bash
bun run build:all
```

This creates optimized, standalone executables in the `dist/` directory that don't require Bun to be installed on the target system.

### Installing System-wide

Install the binary to your system PATH:
```bash
./scripts/install.sh
```

Verify the installation:
```bash
postgeist --version
postgeist --help
```

### Uninstalling

Remove the binary from your system:
```bash
./scripts/install.sh --uninstall
```

Or manually:
```bash
sudo rm /usr/local/bin/postgeist
```

### Troubleshooting

**Binary not found after installation:**
- Restart your terminal
- Check if `/usr/local/bin` is in your PATH: `echo $PATH`
- Add to PATH if needed: `export PATH="/usr/local/bin:$PATH"`

**Permission denied during installation:**
- The installer will use `sudo` when needed
- Ensure you can run `sudo` commands

**Build fails:**
- Ensure Bun is installed and up to date: `bun upgrade`
- Clear the dist directory: `bun run clean`
- Try building again: `bun run build:binary`

## 🧪 Development

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/your-username/postgeist.git
cd postgeist

# Install dependencies
bun install

# Run in development mode
bun run dev

# Run tests
bun test

# Lint and format
bun run lint
bun run format
```

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run linting and tests: `bun run lint && bun test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [The Convocation Twitter Scraper](https://github.com/the-convocation/twitter-scraper) for Twitter API wrapper
- [Google AI SDK](https://github.com/vercel/ai) for AI integration
- [Clack](https://github.com/natemoo-re/clack) for beautiful CLI prompts
- [Bun](https://bun.sh) for the amazing JavaScript runtime

## 🐛 Issues & Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-username/postgeist/issues) page
2. Create a new issue with detailed information
3. Include error messages, environment details, and steps to reproduce

## 🗺️ Roadmap

- [ ] Web interface for easier management
- [ ] Multiple AI model support (OpenAI, Claude, etc.)
- [ ] Batch processing for multiple users
- [ ] Advanced analytics and insights
- [ ] Post scheduling integration
- [ ] Plugin system for extensibility
- [ ] Docker support for easy deployment

---

<div align="center">

**[⭐ Star this repo](https://github.com/your-username/postgeist)** if you find it useful!

Made with ❤️ by [Your Name](https://github.com/your-username)

</div>
