# Installation Guide

Brainiac is available in multiple versions to suit your needs:

- **GUI Version** - Web-based interface (runs in browser or as desktop app)
- **CLI Version** - Command-line interface for terminal users
- **TUI Version** - Terminal User Interface with rich visual elements
- **Desktop App** - Native application for Mac, Windows, and Linux

## Prerequisites

- Node.js 18+ and npm
- (For CLI/TUI) No additional requirements
- (For Desktop App) Electron will be installed automatically

## Installation Methods

### Method 1: Clone from GitHub (Recommended for Developers)

```bash
git clone https://github.com/zanni098/brainiac.git
cd brainiac
npm install
```

### Method 2: Install via npm (Coming Soon)

```bash
npm install -g brainiac
```

### Method 3: Download Desktop App (Coming Soon)

Download the appropriate installer for your platform from the [Releases](https://github.com/zanni098/brainiac/releases) page.

## Running Brainiac

### GUI Version (Web)

#### Development Mode
```bash
npm run dev
```
Open http://localhost:5173 in your browser.

#### Production Build
```bash
npm run build
npm run preview
```

### CLI Version

#### Run Directly
```bash
npm run cli -- --help
```

#### Configure API
```bash
npm run cli config
```

#### Research a Topic
```bash
npm run cli research "quantum computing"
```

#### View History
```bash
npm run cli history
```

#### Export Report
```bash
npm run cli research "climate change" -o report.md
npm run cli export 1 output.md
```

### TUI Version

```bash
npm run tui
```

Use keyboard shortcuts:
- `Enter`: Research
- `Ctrl+C`: Exit
- `Ctrl+E`: Export current report
- `Ctrl+H`: View history

### Desktop App

#### Development Mode
```bash
npm run electron:dev
```

#### Build for All Platforms
```bash
npm run electron:build
```

#### Build for Specific Platform
```bash
npm run electron:build:mac    # macOS
npm run electron:build:win    # Windows
npm run electron:build:linux  # Linux
```

Built applications will be in the `dist/` directory.

## Platform-Specific Notes

### macOS
- Desktop app builds as `.dmg` and `.zip`
- Requires macOS 10.13 (High Sierra) or later
- Notarization required for distribution (configure in electron-builder)

### Windows
- Desktop app builds as `.exe` installer and portable version
- Requires Windows 10 or later
- May require antivirus exception for unsigned builds

### Linux
- Desktop app builds as `.AppImage`, `.deb`, and `.rpm`
- Tested on Ubuntu 20.04+, Fedora 35+, Debian 11+
- AppImage works on most Linux distributions

## Global CLI Installation (Optional)

To use Brainiac CLI from anywhere:

```bash
npm link
```

Then you can run:
```bash
brainiac --help
brainiac config
brainiac research "your query"
```

To unlink:
```bash
npm unlink -g brainiac
```

## Configuration

All versions share the same configuration stored in `~/.brainiac/config.json`:

```json
{
  "provider": "anthropic",
  "apiUrl": "https://api.anthropic.com/v1/messages",
  "apiKey": "your-api-key",
  "model": "claude-sonnet-4-20250514",
  "maxTokens": 4096
}
```

Configure via CLI:
```bash
brainiac config
```

Or edit the config file directly.

## Troubleshooting

### "Module not found" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Electron build fails
```bash
npm install electron@latest electron-builder@latest --save-dev
```

### CLI/TUI display issues
- Ensure your terminal supports UTF-8
- For TUI, use a terminal with 256-color support
- On Windows, use PowerShell or Windows Terminal (not CMD)

### Permission errors
```bash
# On Unix-like systems
chmod +x cli/index.js
chmod +x tui/index.js
```

## Uninstallation

### Remove npm global package
```bash
npm uninstall -g brainiac
```

### Remove configuration and history
```bash
# Unix-like systems
rm -rf ~/.brainiac

# Windows
rmdir %USERPROFILE%\.brainiac
```

### Remove cloned repository
```bash
rm -rf brainiac
```

## Development

For development setup, see [DEVELOPMENT.md](DEVELOPMENT.md).

## Support

For issues or questions:
- GitHub Issues: https://github.com/zanni098/brainiac/issues
- Documentation: https://github.com/zanni098/brainiac/blob/main/README.md