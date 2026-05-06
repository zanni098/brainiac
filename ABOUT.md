# About Brainiac

Brainiac is a sophisticated research agent designed to bridge the gap between powerful Large Language Models (LLMs) and practical research workflows. It transforms the capabilities of modern AI into a tool for deep, sourced research with beautiful presentation.

## Origin Story

Brainiac was born from a simple observation: while LLMs are incredibly powerful, they often lack the ability to provide verifiable, cited sources for their claims. Traditional search engines provide sources but lack the analytical depth and synthesis that AI can offer. Brainiac combines the best of both worlds.

Starting as a research agent hardcoded to use Anthropic's Claude API, it quickly became clear that the research workflow should be provider-agnostic. Users should be able to leverage their existing API investments—whether that's Anthropic, OpenAI, or local models—without being locked into a single ecosystem.

## Philosophy

### Research-First Design

Every design decision in Brainiac prioritizes the research process:

- **Structured Output**: Reports follow a consistent format (Summary → Background → Recent News → Key Books → Analysis → References) making it easy to scan and verify information
- **Citation Integrity**: Every claim is backed by a citation, with full URLs provided in the references section
- **Source Diversity**: Automatically queries multiple sources (Wikipedia for context, Open Library for literature, web search for current events) to provide a well-rounded perspective

### Flexibility Over Lock-In

Brainiac is designed to work with your preferred LLM infrastructure:

- **No Vendor Lock-in**: Switch between providers without changing your workflow
- **Local-Model Ready**: Use with Ollama, LM Studio, or any local LLM via a custom API endpoint
- **Customizable Behavior**: Modify system prompts, token limits, and model parameters to suit your needs

### Privacy Conscious

Research often involves sensitive topics. Brainiac respects your privacy:

- **Local Configuration**: API keys and settings are stored only in your browser's localStorage
- **No Middleman**: Direct API calls to your chosen provider—no data passes through third-party servers
- **Session Isolation**: Clear your browser data to completely remove all credentials

## Technical Architecture

### Component Structure

Brainiac is a single React component designed for simplicity and portability:

```
Brainiac (Main Component)
├── Configuration State (localStorage-backed)
├── API Adapters (Provider-specific implementations)
│   ├── Anthropic Adapter
│   ├── OpenAI Adapter
│   └── Custom Adapter
├── Research Engine (runResearch function)
├── UI Components
│   ├── Settings Panel
│   ├── Search Interface
│   ├── Progress Indicator
│   └── Report Renderer
└── Formatting Utilities
    ├── CitedText (citation renderer)
    └── ReportView (structured report parser)
```

### API Adapter Pattern

The core innovation in Brainiac is the API adapter pattern. Each LLM provider has a different API format—different request structures, authentication methods, and streaming protocols. The adapter pattern abstracts these differences:

```javascript
const API_ADAPTERS = {
  provider: {
    formatRequest: (config, query) => { /* ... */ },
    formatHeaders: (config, apiKey) => { /* ... */ },
    parseStream: (line) => { /* ... */ }
  }
};
```

This makes adding new providers straightforward: implement three functions (format request, format headers, parse stream) and Brainiac can work with any LLM API.

### Streaming Response Handling

Brainiac uses Server-Sent Events (SSE) for real-time streaming:

1. **Request Initiation**: Send research query with streaming enabled
2. **Stream Processing**: Parse incoming SSE chunks line-by-line
3. **Event Detection**: Identify text generation and tool use events
4. **UI Updates**: Update the report in real-time as content arrives
5. **Search Tracking**: Count web search tool invocations for progress indication

### Citation System

The citation system uses a simple but effective approach:

- **Inline Citations**: Superscript numbers `[1][2][3]` embedded in the text
- **Reference Extraction**: Parse the References section to extract numbered URLs
- **Visual Rendering**: Style citations in gold with monospace typography for easy scanning

## Use Cases

### Academic Research

Students and researchers can use Brainiac to:
- Get quick overviews of unfamiliar topics
- Find relevant books and literature through Open Library
- Identify recent developments in their field
- Generate starting points for deeper investigation

### Journalistic Investigation

Journalists can leverage Brainiac to:
- Research background on breaking news stories
- Find historical context for current events
- Identify key sources and experts
- Generate structured notes for articles

### Business Intelligence

Professionals can use Brainiac for:
- Competitive analysis and market research
- Industry trend identification
- Technology landscape mapping
- Due diligence on companies or technologies

### Personal Learning

Curious minds can:
- Explore new interests with cited sources
- Get book recommendations on any topic
- Understand complex subjects with structured explanations
- Build knowledge bases with verifiable information

## Design Decisions

### Why React?

React was chosen for several reasons:
- **Component Model**: Clean separation of concerns (settings, search, report rendering)
- **State Management**: Built-in hooks for managing complex state (query, report, configuration)
- **Ecosystem**: Easy integration into existing React projects
- **Performance**: Efficient re-rendering for streaming updates

### Why Inline Styles?

While CSS-in-JS or external stylesheets are common, Brainiac uses inline styles for:
- **Portability**: Single-file component with no external dependencies
- **Simplicity**: No build step or configuration required
- **Self-Contained**: Easy to copy-paste into any project
- **Customization**: Styles are co-located with the components they affect

### Why localStorage for Configuration?

Configuration persistence via localStorage offers:
- **Zero Backend**: No server required to store user preferences
- **Privacy**: Data never leaves the user's browser
- **Simplicity**: No database or authentication needed
- **Instant**: Configuration persists across sessions automatically

## Future Vision

Brainiac is designed to evolve. Future directions include:

### Enhanced Research Capabilities
- **Multi-Source Aggregation**: Integrate academic databases (arXiv, PubMed)
- **Image Analysis**: Process and cite visual sources
- **Data Extraction**: Pull structured data from research sources
- **Cross-Language**: Research in multiple languages with translation

### Collaboration Features
- **Shared Reports**: Export and share research with citations intact
- **Version History**: Track changes to research over time
- **Team Workspaces**: Collaborative research environments
- **Comment System**: Annotate reports with team insights

### Advanced Customization
- **Custom Report Templates**: Define your own report structures
- **Source Selection**: Choose which sources to query
- **Citation Styles**: Support APA, MLA, Chicago formats
- **Export Formats**: PDF, Markdown, Word, LaTeX

### Integration
- **Browser Extension**: Research from any webpage
- **API Access**: Programmatic research queries
- **Webhook Support**: Automate research workflows
- **Slack/Discord Bot**: Research via chat interfaces

## Performance Considerations

Brainiac is optimized for responsiveness:

- **Streaming**: Real-time updates as content generates
- **Debounced Input**: Prevent unnecessary API calls
- **Efficient Parsing**: Line-by-line stream processing
- **Minimal Re-renders**: React's virtual DOM handles updates efficiently

## Security Model

Brainiac follows a client-side security model:

- **Credential Storage**: API keys in localStorage (same security level as browser cookies)
- **Direct API Calls**: No proxy servers—your credentials go directly to your chosen provider
- **No Data Collection**: No analytics, telemetry, or user tracking
- **Open Source**: Full code transparency—audit the code yourself

## Community

Brainiac is open source and community-driven. We welcome:

- **Bug Reports**: Help us identify and fix issues
- **Feature Requests**: Suggest improvements and new capabilities
- **Code Contributions**: Add new providers, fix bugs, enhance features
- **Documentation**: Improve guides and examples
- **Translations**: Make Brainiac accessible globally

## License

Brainiac is released under the MIT License, which means:
- ✅ Free to use for personal and commercial projects
- ✅ Free to modify and extend
- ✅ Free to distribute
- ❌ No warranty provided
- ❌ No liability accepted

This permissive license encourages adoption and contribution while protecting the project's maintainers.

## Credits

Brainiac was created by [zanni098](https://github.com/zanni098), a developer passionate about making AI tools accessible and useful for real-world research workflows.

Inspired by the growing ecosystem of AI research tools and the need for flexible, provider-agnostic solutions.

---

For more information, visit the [GitHub repository](https://github.com/zanni098/brainiac) or check out the [README](README.md) for usage instructions.
