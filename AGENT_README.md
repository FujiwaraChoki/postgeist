# 🤖 Postgeist AI Agent

A standalone AI agent powered by the latest AI SDK v5 and Tavily for Twitter analysis and content generation.

## 🚀 Features

- **Twitter Analysis**: Analyze any public Twitter user's posting patterns, themes, and writing style
- **Content Generation**: Generate authentic post ideas that match a user's unique voice
- **Web Search**: Search the web for current information using Tavily
- **Website Visiting**: Extract content from websites for research
- **Interactive Mode**: Run in a conversational loop for natural interaction
- **Multi-step Tool Usage**: Agent can chain multiple tools to complete complex tasks

## 🛠️ Technologies

- **AI SDK v5** (Beta) - The newest version with advanced agent capabilities
- **Tavily** - For web search functionality
- **Google Gemini 2.5 Flash** - The latest LLM for analysis and generation
- **Bun** - Fast JavaScript runtime

## 🚀 Quick Start

### Interactive Mode (Recommended)

Run the agent in interactive mode for natural conversation:

```bash
bun run agent
```

Or with hot reload during development:

```bash
bun run agent:dev
```

### Single Command Mode

Process a single command and exit:

```bash
bun run agent "Analyze @elonmusk and generate 5 post ideas"
```

## 💬 Example Conversations

### Analyze a Twitter User
```
You: "Analyze @sama and tell me about his posting style"
Agent: [Analyzes Sam Altman's tweets and provides detailed insights about his posting patterns, themes, and style]
```

### Generate Post Ideas
```
You: "Generate 10 post ideas for @gdb that sound like him"
Agent: [Creates authentic post ideas matching the user's voice and style]
```

### Research + Analysis
```
You: "Search for recent AI news and then analyze @karpathy to generate posts about those topics"
Agent: [Searches web for AI news, analyzes Andrej Karpathy's style, then generates relevant posts]
```

### Get User Information
```
You: "Show me all the users I've analyzed"
Agent: [Lists all previously analyzed users with their stats]
```

## 🧠 Agent Capabilities

### Twitter Tools
- `analyzeTwitterUser` - Deep analysis of posting patterns and style
- `generatePostIdeas` - Create authentic content matching user's voice
- `getUserInfo` - Get information about analyzed users
- `listUsers` - Show all previously analyzed users

### Web Tools
- `web_search` - Search the web using Tavily
- `website_visit` - Extract content from websites

### Agent Intelligence
- **Multi-step reasoning**: Can chain multiple tool calls
- **Context awareness**: Remembers conversation context
- **Error handling**: Graceful error recovery with helpful messages
- **Natural language**: Understands complex, conversational requests

## 🔧 Configuration

The agent uses the same configuration as the main Postgeist app:

### Required Environment Variables

```bash
# Twitter credentials for scraping
TWITTER_USERNAME="your_twitter_username"
TWITTER_PASSWORD="your_twitter_password"
TWITTER_EMAIL="your_twitter_email"    # optional

# Tavily API key for web search
TAVILY_API_KEY="your_tavily_api_key"

# Google AI API key for Gemini
GOOGLE_GENERATIVE_AI_API_KEY="your_google_ai_key"
```

### Optional Configuration

```bash
DATA_DIR=./data                   # Data storage directory
LOG_LEVEL=WARN                    # Logging level
MAX_POSTS_TO_ANALYZE=400          # Posts to analyze
MAX_POSTS_FOR_PROMPT=50          # Posts for AI prompt
```

## 🎯 Usage Examples

### Analyze and Generate in One Command
```bash
bun run agent "Analyze @paulg and generate 5 post ideas about startups"
```

### Research-Based Content Generation
```bash
bun run agent "Search for the latest AI trends, then generate posts for @sama about those trends"
```

### Bulk Analysis
```bash
bun run agent "Analyze @elonmusk, @jeffbezos, and @sundarpichai, then compare their posting styles"
```

## 🔄 How It Works

1. **Natural Language Processing**: The agent understands your request in natural language
2. **Tool Selection**: Uses AI to determine which tools are needed
3. **Multi-step Execution**: Chains multiple tools together (e.g., search web → analyze user → generate posts)
4. **Intelligent Response**: Provides comprehensive, contextual responses

## 🎨 Agent Architecture

```
User Input → AI SDK v5 → Tool Selection → Execution → Response
                ↓
            [Twitter Analysis, Web Search, Website Visit, Content Generation]
```

The agent uses the latest AI SDK v5 with:
- `generateText` with `maxSteps` for multi-step reasoning
- `tool()` functions for defining capabilities
- `streamText` for real-time responses
- Tavily integration for web search
- Google Gemini 2.5 Flash for intelligence

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   bun install
   ```

2. **Set up environment variables** (see Configuration above)

3. **Run the agent**:
   ```bash
   bun run agent
   ```

4. **Start chatting**:
   ```
   🤖 What would you like me to do?
   > Analyze @sama and generate 3 post ideas about AI
   ```

## 🔍 Advanced Features

- **Streaming responses**: Real-time text generation
- **Error recovery**: Intelligent error handling and suggestions
- **Context persistence**: Remembers analyzed users across sessions
- **Custom instructions**: Add custom guidelines for post generation
- **Community tagging**: Organize posts by topics/communities

## 📊 Output Examples

### Analysis Output
```json
{
  "success": true,
  "username": "sama",
  "postsCount": 324,
  "analysis": {
    "summary": "Sam Altman focuses on AI safety, startup advice, and technology trends...",
    "keyThemes": ["AI", "Startups", "Technology", "Future"],
    "tone": "Professional, thoughtful, occasionally humorous",
    "randomFacts": ["Often posts about AI safety concerns", "Prefers short, impactful statements"]
  }
}
```

### Generated Posts
```json
{
  "success": true,
  "username": "sama",
  "count": 3,
  "postIdeas": [
    {
      "text": "The most important question in AI isn't when AGI arrives, but whether we'll be ready for it.",
      "characterCount": 108,
      "reasoning": "Matches Sam's thoughtful tone about AI safety"
    }
  ]
}
```

---

**Built with ❤️ using AI SDK v5, Tavily, and the latest AI technologies**
