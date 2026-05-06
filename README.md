# Brainiac 🧠

A flexible, customizable research agent that supports custom LLM API integration. Brainiac performs deep research with cited sources, enabling you to connect any LLM provider (Anthropic, OpenAI, or custom APIs) to generate comprehensive research reports.

![Brainiac](https://img.shields.io/badge/Brainiac-Research%20Agent-gold) ![React](https://img.shields.io/badge/React-18+-blue) ![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

- **Multi-Provider Support**: Seamlessly switch between Anthropic Claude, OpenAI GPT, or any custom LLM API
- **Deep Research**: Automatically searches Wikipedia, Open Library, and recent news articles
- **Cited Sources**: Generates reports with inline citations and numbered references
- **Streaming Responses**: Real-time text generation with search progress indicators
- **Custom Configuration**: Configure API endpoints, models, tokens, and system prompts
- **Beautiful UI**: Elegant, dark-themed interface with smooth animations
- **Local Storage**: Saves your API configuration securely in your browser
- **Zero Dependencies**: Pure React component - no build tools required

## 🚀 Quick Start

### Installation

1. Clone the repository:
```bash
git clone https://github.com/zanni098/brainiac.git
cd brainiac
```

2. Install dependencies (if using a React project):
```bash
npm install react
```

3. Import the component:
```jsx
import Brainiac from './brainiac';
```

4. Use it in your app:
```jsx
function App() {
  return <Brainiac />;
}
```

### Configuration

1. Click the **⚙️ SETTINGS** button in the top-right corner
2. Select your API provider:
   - **Anthropic (Claude)**: Uses Anthropic's API format
   - **OpenAI (GPT)**: Uses OpenAI's API format
   - **Custom**: For any other LLM API
3. Enter your API credentials:
   - **API URL**: Your provider's endpoint (e.g., `https://api.anthropic.com/v1/messages`)
   - **API Key**: Your authentication key (stored locally in your browser)
   - **Model**: The model name (e.g., `claude-sonnet-4-20250514`, `gpt-4`)
   - **Max Tokens**: Maximum response length
   - **System Prompt**: Optional custom instructions for the AI

### Usage

1. Enter a research topic in the search box
2. Click **RESEARCH →** or press Enter
3. Watch as Brainiac searches multiple sources and generates a cited report
4. Review the structured report with sections for Summary, Background, Recent News, Key Books, Analysis, and References

## 🔧 API Provider Setup

### Anthropic Claude

```javascript
{
  provider: "anthropic",
  apiUrl: "https://api.anthropic.com/v1/messages",
  apiKey: "sk-ant-...",
  model: "claude-sonnet-4-20250514",
  maxTokens: 1000
}
```

Get your API key from: https://console.anthropic.com/

### OpenAI GPT

```javascript
{
  provider: "openai",
  apiUrl: "https://api.openai.com/v1/chat/completions",
  apiKey: "sk-...",
  model: "gpt-4",
  maxTokens: 1000
}
```

Get your API key from: https://platform.openai.com/api-keys

### Custom API (Local Models, Ollama, etc.)

```javascript
{
  provider: "custom",
  apiUrl: "http://localhost:11434/api/chat", // Example: Ollama
  apiKey: "your-key-or-empty",
  model: "llama2",
  maxTokens: 2000
}
```

For local models like Ollama, you may need a proxy server to handle streaming. The custom adapter assumes Anthropic-style streaming format.

## 📋 Report Structure

Brainiac generates reports with these sections:

- **## [Title]**: Descriptive title for the research
- **### Summary**: Brief overview of findings
- **### Background**: Historical context from Wikipedia
- **### Recent news**: Current developments (last 12 months)
- **### Key books**: Relevant literature from Open Library
- **### Analysis**: Deep dive and insights
- **### References**: Numbered list with full URLs

All claims are cited inline using superscript numbers `[1][2][3]` with corresponding references at the end.

## 🎨 Customization

### System Prompt

Modify the system prompt to change research behavior:

```javascript
systemPrompt: `You are a research analyst. For every query you MUST:
1. Search Wikipedia for background and context
2. Search Open Library (openlibrary.org) for relevant books
3. Search for recent news articles (last 12 months)

Then write a structured report using EXACTLY these headers:
## [Descriptive title for this report]
### Summary
### Background
### Recent news
### Key books
### Analysis
### References

Rules:
- Cite inline as [1][2][3] using superscript numbers
- References section: numbered list, include full URLs
- Each section minimum 3-5 sentences
- Be specific, analytical, and cite everything`
```

### Styling

The component uses inline styles for simplicity. To customize the appearance, modify the style objects in the component or extract them to a CSS file.

## 🔒 Security

- **API keys are stored locally** in your browser's localStorage
- No data is sent to any server other than your configured LLM API
- Configuration persists between sessions on the same device
- Clear your browser data to remove stored credentials

## 🛠️ Development

### Project Structure

```
brainiac/
├── brainiac.jsx       # Main React component
├── README.md          # This file
└── ABOUT.md           # Detailed about documentation
```

### Adding New API Providers

To add support for a new LLM provider, extend the `API_ADAPTERS` object in `brainiac.jsx`:

```javascript
const API_ADAPTERS = {
  // ... existing adapters
  yourProvider: {
    formatRequest: (config, query) => ({
      // Format request for your API
    }),
    formatHeaders: (config, apiKey) => ({
      // Format headers for your API
    }),
    parseStream: (line) => {
      // Parse streaming response
    }
  }
};
```

## 🤝 Contributing

Contributions are welcome! Areas for improvement:

- Additional API provider adapters (Google Gemini, Cohere, etc.)
- Export reports to PDF/Markdown
- Save research history
- Collaborative research features
- Mobile responsive improvements
- Internationalization support

Feel free to open issues or submit pull requests.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Original research agent concept
- Anthropic Claude API
- OpenAI GPT API
- React community

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub: https://github.com/zanni098/brainiac/issues
- Contact: https://asadsinc.vercel.app/

---

Made with ❤️ by [zanni098](https://github.com/zanni098)
