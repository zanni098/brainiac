# Testing Guide

This guide covers how to test each version of Brainiac.

## Prerequisites

- Node.js 18+ installed
- API key from Anthropic or OpenAI
- Terminal/Command Prompt

## GUI Version Testing

### Quick Start
```bash
cd C:\Users\eishm\CascadeProjects\brainiac
npm run dev
```
Open http://localhost:5173 in your browser.

### Test Steps
1. Click **⚙️ SETTINGS** button
2. Select provider (Anthropic or OpenAI)
3. Enter your API key
4. Click **RESEARCH →** with a test query like "quantum computing"
5. Verify:
   - Search progress indicator appears
   - Report generates with citations
   - History shows the research
   - Export buttons work (MD, TXT, JSON)

### Expected Results
- Real-time streaming of text
- Citations displayed as superscript numbers
- References section with URLs
- History panel shows past research

## CLI Version Testing

### Installation (Local)
```bash
cd C:\Users\eishm\CascadeProjects\brainiac
npm run cli config
```
Follow prompts to set up API key.

### Installation (Global - Coming Soon)
```bash
npm install -g brainiac
```

### Test Steps
```bash
# Test research
brainiac research "artificial intelligence ethics"

# Test export
brainiac research "climate change" -o test-report.md

# Test history
brainiac history

# Test export from history
brainiac export 1 exported-report.md
```

### Expected Results
- Colored terminal output with spinner
- Report displays with proper formatting
- File exports successfully
- History shows previous research

## TUI Version Testing

### Quick Start
```bash
cd C:\Users\eishm\CascadeProjects\brainiac
npm run tui
```

### Test Steps
1. Type a query in the input box
2. Press **Enter** to research
3. Verify:
   - Status shows "Researching..."
   - Report displays with colored formatting
   - Press **Ctrl+E** to export
   - Press **Ctrl+H** to view history
   - Press **Ctrl+C** to exit

### Expected Results
- Rich terminal interface with colors
- Keyboard shortcuts work
- Report formats correctly in terminal
- Export saves to home directory

## Common Issues

### GUI
- **Blank screen**: Check browser console for errors
- **API errors**: Verify API key in settings
- **No streaming**: Check network connection

### CLI
- **Command not found**: Use `npm run cli` instead
- **API errors**: Run `brainiac config` to set key
- **Permission denied**: Run as administrator if needed

### TUI
- **Display issues**: Use Windows Terminal or PowerShell
- **Colors not showing**: Terminal may not support 256 colors
- **Keyboard not working**: Ensure terminal has focus

## Testing Checklist

- [ ] GUI loads without errors
- [ ] GUI settings save API key
- [ ] GUI research produces report
- [ ] GUI history works
- [ ] GUI export downloads file
- [ ] CLI config saves settings
- [ ] CLI research produces output
- [ ] CLI history displays
- [ ] CLI export creates file
- [ ] TUI launches without errors
- [ ] TUI research displays report
- [ ] TUI keyboard shortcuts work
- [ ] TUI export saves file