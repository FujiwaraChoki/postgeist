# Postgeist 🚀

AI-Powered Twitter Analysis & Content Generation Tool

Postgeist analyzes Twitter users' posting patterns, writing style, and content themes using AI, then generates authentic post ideas that match their unique voice and style.

## Features

### Core Functionality
- **Twitter Analysis**: Deep AI analysis of posting patterns, themes, and style
- **Content Generation**: Generate post ideas that match the user's authentic voice
- **Style Matching**: AI learns from real posts to replicate writing patterns
- **Community Support**: Organize posts by topics and communities
- **Custom Instructions**: Guide AI generation with personalized preferences

### Deployment Options
- **CLI Tool**: Interactive command-line interface
- **REST API**: HTTP API server for integration
- **Web Interface**: Modern React frontend for browser-based usage

## Quick Start

### 1. Installation

```bash
# Clone and install
git clone https://github.com/FujiwaraChoki/postgeist
cd postgeist
bun install
```

### 2. Setup Twitter Credentials

```bash
# Set environment variables
export TWITTER_USERNAME="your_twitter_username"
export TWITTER_PASSWORD="your_twitter_password"
export TWITTER_EMAIL="your_twitter_email"    # optional
```

### 3. Choose Your Interface

#### CLI (Interactive)
```bash
bun run dev
```

#### API Server
```bash
# Start API server (port 3001)
bun run api:dev

# API will be available at http://localhost:3001
```

#### Web Interface
```bash
# Terminal 1: Start API server
bun run api:dev

# Terminal 2: Start frontend
cd frontend
bun install
bun dev

# Open http://localhost:3000 in your browser
```

## Usage Examples

### CLI Mode
```bash
# Interactive mode
bun run dev

# Direct analysis
bun run start --analyze username

# Generate content
bun run start --generate username --count 10

# Both analyze and generate
bun run start --both username
```

### API Mode
```bash
# Start the API server
bun run api

# Use the API endpoints
curl http://localhost:3001/health
curl -X POST http://localhost:3001/api/analyze/username
curl -X POST http://localhost:3001/api/generate/username
```

### Web Interface
1. Start both API server and frontend
2. Open http://localhost:3000 in your browser
3. Add Twitter users through the web interface
4. View analysis results and generate content

## API Documentation

### Core Endpoints

```bash
# Health check
GET /health

# User management
GET /api/users                    # List all users
GET /api/users/:username          # Get user data
DELETE /api/users/:username       # Delete user

# Twitter scraping
POST /api/scrape/:username        # Scrape user posts
POST /api/scrape/:username/refresh # Refresh posts

# Analysis
POST /api/analyze/:username       # Analyze user
GET /api/analysis/:username       # Get analysis

# Content generation
POST /api/generate/:username      # Generate posts
Body: { "count": 10 }

# Settings
GET /api/settings/:username                         # Get settings
PUT /api/settings/:username/instructions           # Update instructions
POST /api/settings/:username/communities           # Add community
DELETE /api/settings/:username/communities/:name   # Delete community

# Data management
GET /api/data/stats              # Get statistics
POST /api/export/:username       # Export user data
GET /api/auth/status             # Check auth status
```

## Architecture

### Backend
- **Bun Runtime**: Fast JavaScript runtime and bundler
- **Twitter Scraper**: Automated post collection
- **Google Gemini AI**: Advanced language analysis and generation
- **Local Storage**: JSON-based data persistence

### Frontend
- **React 18**: Modern UI framework
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Vite**: Fast build tool and dev server

### Data Flow
1. **Scrape**: Collect recent Twitter posts
2. **Analyze**: AI analyzes writing patterns and themes
3. **Store**: Cache analysis results locally
4. **Generate**: Create new content ideas based on analysis
5. **Export**: Save results in various formats

## Configuration

### Environment Variables

```bash
# Required for Twitter scraping
TWITTER_USERNAME=your_username
TWITTER_PASSWORD=your_password
TWITTER_EMAIL=your_email          # optional

# Optional configuration
DATA_DIR=./data                   # Data storage directory
LOG_LEVEL=WARN                    # Logging level
MAX_POSTS_TO_ANALYZE=400          # Posts to analyze
MAX_POSTS_FOR_PROMPT=50          # Posts for AI prompt
PORT=3001                        # API server port
```

### Custom Instructions
Add personalized instructions to guide AI generation:
- Tone preferences (professional, casual, humorous)
- Content restrictions or requirements
- Specific topics to emphasize or avoid
- Formatting preferences

### Communities
Organize generated content by topics:
- Tech, Design, Personal, Business, etc.
- AI automatically categorizes posts
- Filter and export by community

## Development

### Project Structure
```
postgeist/
├── src/                 # Core CLI application
│   ├── services/        # AI, scraping, data services
│   ├── ui/             # CLI interface components
│   └── types/          # TypeScript definitions
├── api.ts              # REST API server
├── frontend/           # React web interface
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── pages/      # Route components
│   │   └── lib/        # API client and utilities
│   └── dist/           # Built frontend
├── data/               # Local data storage
└── prompts.ts          # AI prompts and templates
```

### Building

```bash
# Build CLI binary
bun run build:binary

# Build for different platforms
bun run build:all

# Build frontend
cd frontend && bun run build
```

## Examples

### Analysis Output
```json
{
  "summary": "Technical content creator focused on web development...",
  "key_themes": ["React", "TypeScript", "Web Performance"],
  "engagement_patterns": ["Morning tweets", "Question-based posts"],
  "tone": "Professional yet approachable, educational focus",
  "randomFacts": ["Prefers short, actionable posts", "Uses code examples"]
}
```

### Generated Content
```json
{
  "text": "Just discovered a neat TypeScript trick that saves me 10 lines of code... 🤯",
  "community": "Tech",
  "reasoning": "Matches user's educational style and emoji usage"
}
```

## Privacy & Security

- **Local Data**: All analysis stored on your machine
- **No Tracking**: No external analytics or tracking
- **Credential Security**: Twitter credentials used only for scraping
- **Data Control**: Export or delete your data anytime
- **AI Processing**: Only analysis sent to Google Gemini API

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/FujiwaraChoki/postgeist/issues)
- **Discussions**: [GitHub Discussions](https://github.com/FujiwaraChoki/postgeist/discussions)
- **Documentation**: Check the `frontend/README.md` for frontend-specific docs

---

Built with ❤️ using Bun, React, and AI
