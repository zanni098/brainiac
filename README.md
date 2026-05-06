# Brainiac 🧠

A complete research agent platform with multiple interfaces - GUI, CLI, TUI, and Desktop App. Brainiac performs deep research with cited sources, enabling you to connect any LLM provider (Anthropic, OpenAI, or custom APIs) to generate comprehensive research reports.

![Brainiac](https://img.shields.io/badge/Brainiac-Research%20Agent-gold) ![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![Electron](https://img.shields.io/badge/Electron-28+-blue) ![License](https://img.shields.io/badge/License-MIT-green)

## 🎯 Available Versions

- **GUI Version** - Modern web interface with real-time streaming
- **CLI Version** - Command-line interface for terminal users
- **TUI Version** - Rich terminal interface with keyboard navigation
- **Desktop App** - Native application for Mac, Windows, and Linux

## ✨ Features

### Core Features (All Versions)
- **Multi-Provider Support**: Anthropic Claude, OpenAI GPT, or any custom LLM API
- **Deep Research**: Searches Wikipedia, Open Library, recent news, and academic sources
- **Cited Sources**: Inline citations with numbered references
- **Custom Configuration**: API endpoints, models, tokens, and system prompts
- **Research History**: Save and review past research sessions
- **Export Options**: Markdown, TXT, and JSON formats

### GUI Version Features
- Real-time streaming responses
- Beautiful dark-themed interface
- Research history browser
- Export to multiple formats
- Responsive design

### CLI Version Features
- Full command-line control
- Batch research capabilities
- History management
- Script-friendly output
- Works on all platforms

### TUI Version Features
- Rich terminal interface
- Keyboard shortcuts
- Visual progress indicators
- Inline report viewing
- History navigation

### Desktop App Features
- Native application experience
- Offline-ready configuration
- System tray integration
- Auto-updates (planned)
- Cross-platform support

## 🚀 Quick Start

### Installation

1. Clone the repository:
```bash
git clone https://github.com/zanni098/brainiac.git
cd brainiac
```

2. Install dependencies:
```bash
npm install
```

3. Configure your API key:
```bash
npm run cli config
```

### Running Brainiac

#### GUI Version (Web)
```bash
npm run dev
```
Open http://localhost:5173 in your browser.

#### CLI Version
```bash
npm run cli research "quantum computing"
npm run cli history
```

#### TUI Version
```bash
npm run tui
```

#### Desktop App
```bash
# Development
npm run electron:dev

# Build for your platform
npm run electron:build:mac    # macOS
npm run electron:build:win    # Windows
npm run electron:build:linux  # Linux
```

For detailed installation instructions, see [INSTALL.md](INSTALL.md).

## 📖 Usage Guide

### GUI Version

1. Click the **⚙️ SETTINGS** button to configure your API
2. Enter a research topic in the search box
3. Click **RESEARCH →** or press Enter
4. View the generated report with citations
5. Use **📚 HISTORY** to review past research
6. Export reports in MD, TXT, or JSON format

### CLI Version

```bash
# Research a topic
brainiac research "climate change"

# Export to file
brainiac research "AI ethics" -o report.md

# View history
brainiac history

# Export specific report
brainiac export 1 output.md

# Clear history
brainiac history --clear
```

### TUI Version

Keyboard shortcuts:
- `Enter`: Research current query
- `Ctrl+C`: Exit
- `Ctrl+E`: Export current report
- `Ctrl+H`: View history

## 🔧 Configuration

All versions share the same configuration stored in `~/.brainiac/config.json`:

```json
{
  "provider": "anthropic",
  "apiUrl": "https://api.anthropic.com/v1/messages",
  "apiKey": "your-api-key",
  "model": "claude-sonnet-4-20250514",
  "maxTokens": 4096,
  "systemPrompt": "..."
}
```

Configure via CLI:
```bash
brainiac config
```

Or edit the file directly.

## 🔧 API Provider Setup

### Anthropic Claude

```javascript
{
  provider: "anthropic",
  apiUrl: "https://api.anthropic.com/v1/messages",
  apiKey: "sk-ant-...",
  model: "claude-sonnet-4-20250514",
  maxTokens: 4096
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
  maxTokens: 4096
}
```

Get your API key from: https://platform.openai.com/api-keys

### Custom API (Local Models, Ollama, etc.)

```javascript
{
  provider: "custom",
  apiUrl: "http://localhost:11434/api/chat",
  apiKey: "your-key-or-empty",
  model: "llama2",
  maxTokens: 4096
}
```

## 📋 Report Structure

Brainiac generates comprehensive reports with these sections:

- **## [Title]**: Descriptive title for the research
- **### Executive Summary**: Brief overview of key findings
- **### Background & Context**: Historical context from Wikipedia
- **### Recent Developments**: Current developments (last 12 months)
- **### Key Findings & Data**: Statistics and data points
- **### Expert Perspectives**: Quotes and expert opinions
- **### Books & Academic Sources**: Relevant literature from Open Library
- **### Critical Analysis**: Deep dive and balanced perspectives
- **### Implications & Future Outlook**: Forward-looking analysis
- **### References**: Numbered list with full URLs and dates

All claims are cited inline using superscript numbers `[1][2][3]` with corresponding references at the end.

## 🎨 Customization

### System Prompt

Modify the system prompt to change research behavior. The default prompt is comprehensive but you can customize it via:

```bash
brainiac config
```

Or edit `~/.brainiac/config.json` directly.

### Styling (GUI Version)

The GUI uses inline styles for portability. To customize:
1. Modify style objects in `gui/brainiac.jsx`
2. Or extract to a CSS file and update `gui/src/index.css`

## 🔒 Security

- **API keys are stored locally** in `~/.brainiac/config.json` (CLI/TUI) or browser localStorage (GUI)
- No data is sent to any server other than your configured LLM API
- Configuration persists between sessions on the same device
- Clear `~/.brainiac/` directory or browser data to remove credentials

## 🛠️ Development

### Project Structure

```
brainiac/
├── gui/              # Web/GUI version
│   ├── brainiac.jsx  # Main React component
│   ├── src/          # React app source
│   └── index.html    # HTML entry point
├── cli/              # CLI version
│   └── index.js      # CLI implementation
├── tui/              # TUI version
│   └── index.js      # Terminal UI implementation
├── electron/         # Desktop app
│   └── main.js       # Electron main process
├── package.json      # Dependencies and scripts
├── vite.config.js    # Vite configuration
├── README.md         # This file
├── INSTALL.md        # Detailed installation guide
└── ABOUT.md          # About documentation
```

### Adding New API Providers

To add support for a new LLM provider, extend the `API_ADAPTERS` object in the appropriate version file:

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
    parseResponse: (data) => {
      // Parse response (CLI/TUI)
    },
    parseStream: (line) => {
      // Parse streaming response (GUI)
    }
  }
};
```

## 🤝 Contributing

Contributions are welcome! Areas for improvement:

- Additional API provider adapters (Google Gemini, Cohere, etc.)
- Export reports to PDF
- Collaborative research features
- Mobile app version
- Internationalization support
- Plugin system for custom data sources

Feel free to open issues or submit pull requests.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Original research agent concept
- Anthropic Claude API
- OpenAI GPT API
- React, Vite, and Electron communities
- Blessed and Commander libraries

## 📞 Support

For issues, questions, or suggestions:
- GitHub Issues: https://github.com/zanni098/brainiac/issues
- Documentation: [INSTALL.md](INSTALL.md), [ABOUT.md](ABOUT.md)

---

Made with ❤️ by [zanni098](https://github.com/zanni098)
