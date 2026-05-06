#!/usr/bin/env node

const blessed = require('blessed');
const contrib = require('blessed-contrib');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const CONFIG_DIR = path.join(os.homedir(), '.brainiac');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  }
  return {
    apiUrl: 'https://api.anthropic.com/v1/messages',
    apiKey: '',
    model: 'claude-sonnet-4-20250514',
    maxTokens: 4096,
    provider: 'anthropic',
    systemPrompt: `You are a research analyst. For every query you MUST:
1. Search Wikipedia for background and context
2. Search Open Library (openlibrary.org) for relevant books
3. Search for recent news articles (last 12 months)
4. Search academic sources when relevant
5. Provide data and statistics when available

Then write a structured report using EXACTLY these headers:
## [Descriptive title for this report]
### Executive Summary
### Background & Context
### Recent Developments
### Key Findings & Data
### Expert Perspectives
### Books & Academic Sources
### Critical Analysis
### Implications & Future Outlook
### References

Rules:
- Cite inline as [1][2][3] using superscript numbers
- References section: numbered list, include full URLs and publication dates
- Each section minimum 5-7 sentences
- Be specific, analytical, and cite everything`
  };
}

// API adapters
const API_ADAPTERS = {
  anthropic: {
    formatRequest: (config, query) => ({
      model: config.model,
      max_tokens: config.maxTokens,
      system: config.systemPrompt,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: `Research this thoroughly: "${query}"` }],
      stream: false
    }),
    formatHeaders: (config, apiKey) => ({
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    }),
    parseResponse: (data) => {
      if (data.content && data.content[0] && data.content[0].text) {
        return data.content[0].text;
      }
      throw new Error('Invalid response format');
    }
  },
  openai: {
    formatRequest: (config, query) => ({
      model: config.model,
      max_tokens: config.maxTokens,
      messages: [
        { role: 'system', content: config.systemPrompt },
        { role: 'user', content: `Research this thoroughly: "${query}"` }
      ],
      stream: false
    }),
    formatHeaders: (config, apiKey) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }),
    parseResponse: (data) => {
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      }
      throw new Error('Invalid response format');
    }
  },
  custom: {
    formatRequest: (config, query) => ({
      model: config.model,
      max_tokens: config.maxTokens,
      messages: [
        { role: 'system', content: config.systemPrompt },
        { role: 'user', content: `Research this thoroughly: "${query}"` }
      ],
      stream: false
    }),
    formatHeaders: (config, apiKey) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }),
    parseResponse: (data) => {
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      }
      if (data.content) {
        return data.content;
      }
      throw new Error('Invalid response format');
    }
  }
};

async function runResearch(query, config) {
  const adapter = API_ADAPTERS[config.provider] || API_ADAPTERS.anthropic;
  const body = adapter.formatRequest(config, query);
  const headers = adapter.formatHeaders(config, config.apiKey);

  const response = await axios.post(config.apiUrl, body, { headers });
  return adapter.parseResponse(response.data);
}

// Create TUI
const screen = blessed.screen({
  smartCSR: true,
  title: 'Brainiac Research Agent'
});

// Simple form layout
const form = blessed.form({
  parent: screen,
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  keys: true,
  mouse: true
});

// Header
const header = blessed.box({
  parent: form,
  top: 0,
  left: 0,
  width: '100%',
  height: 1,
  content: ' {bold}{cyan-fg}🧠 Brainiac Research Agent{/cyan-fg}{/bold} ',
  tags: true,
  style: {
    fg: 'white',
    bg: 'blue'
  }
});

// Input box
const inputBox = blessed.textarea({
  parent: form,
  top: 2,
  left: 1,
  width: '100%-2',
  height: 3,
  label: ' Research Query (press Enter to submit): ',
  inputOnFocus: true,
  keys: true,
  mouse: true,
  style: {
    fg: 'white',
    bg: 'black',
    focus: {
      bg: 'blue'
    }
  },
  border: {
    type: 'line'
  }
});

// Status box
const statusBox = blessed.box({
  parent: form,
  top: 5,
  left: 1,
  width: '100%-2',
  height: 1,
  content: ' Ready - Type a query and press Enter to research ',
  tags: true,
  style: {
    fg: 'green',
    bg: 'black'
  }
});

// Output box
const outputBox = blessed.textarea({
  parent: form,
  top: 6,
  left: 1,
  width: '100%-2',
  height: '100%-10',
  label: ' Research Report ',
  scrollable: true,
  alwaysScroll: true,
  keys: true,
  mouse: true,
  style: {
    fg: 'white',
    bg: 'black'
  },
  border: {
    type: 'line'
  },
  scrollbar: {
    ch: '│',
    style: {
      bg: 'blue'
    }
  }
});

// Help box
const helpBox = blessed.box({
  parent: form,
  bottom: 0,
  left: 0,
  width: '100%',
  height: 2,
  content: ' {bold}Enter{/bold}: Research | {bold}Ctrl+C{/bold}: Exit | {bold}Ctrl+E{/bold}: Export | {bold}Ctrl+H{/bold}: History | {bold}Ctrl+R{/bold}: Return to input ',
  tags: true,
  style: {
    fg: 'gray',
    bg: 'black'
  }
});

// History
let history = [];
const historyFile = path.join(CONFIG_DIR, 'history.json');
if (fs.existsSync(historyFile)) {
  history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
}

let currentReport = '';

// Event handlers
inputBox.key('enter', async () => {
  const query = inputBox.getValue();
  if (!query.trim()) return;

  const config = loadConfig();

  if (!config.apiKey) {
    statusBox.setContent('{red-fg}Error: No API key configured. Use CLI to run: brainiac config{/red-fg}');
    screen.render();
    return;
  }

  inputBox.clearValue();
  screen.render();

  statusBox.setContent('{yellow-fg}Researching...{/yellow-fg}');
  screen.render();

  try {
    const report = await runResearch(query, config);
    currentReport = report;

    // Format for TUI
    const formattedReport = report
      .replace(/## (.+)/g, '\n{bold}{cyan-fg}$1{/cyan-fg}{/bold}\n')
      .replace(/### (.+)/g, '\n{bold}{yellow-fg}$1{/yellow-fg}{/bold}\n')
      .replace(/\[(\d+)\]/g, '{green-fg}[$1]{/green-fg}');

    outputBox.setValue(formattedReport);
    outputBox.focus();
    statusBox.setContent('{green-fg}Research complete!{/green-fg}');

    // Save to history
    history.unshift({
      id: Date.now(),
      query,
      report,
      timestamp: new Date().toISOString()
    });
    history = history.slice(0, 50);
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));

  } catch (error) {
    statusBox.setContent(`{red-fg}Error: ${error.message}{/red-fg}`);
  }

  screen.render();
});

inputBox.key('C-c', () => {
  return process.exit(0);
});

screen.key(['escape', 'q', 'C-c'], () => {
  return process.exit(0);
});

// Return to input
screen.key('C-r', () => {
  inputBox.focus();
  statusBox.setContent('{green-fg}Ready - Type a query and press Enter to research{/green-fg}');
  screen.render();
});

// Export functionality
screen.key('C-e', () => {
  if (!currentReport) {
    statusBox.setContent('{yellow-fg}No report to export{/yellow-fg}');
    screen.render();
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `brainiac-report-${timestamp}.md`;
  const filepath = path.join(os.homedir(), filename);

  fs.writeFileSync(filepath, currentReport);
  statusBox.setContent(`{green-fg}Exported to ${filepath}{/green-fg}`);
  screen.render();
});

// History viewer
screen.key('C-h', () => {
  if (history.length === 0) {
    statusBox.setContent('{yellow-fg}No history available{/yellow-fg}');
    screen.render();
    return;
  }

  let historyText = '{bold}{cyan-fg}Research History{/cyan-fg}{/bold}\n\n';
  history.forEach((item, index) => {
    historyText += `${index + 1}. {bold}${item.query}{/bold}\n`;
    historyText += `   ${new Date(item.timestamp).toLocaleString()}\n\n`;
  });

  outputBox.setValue(historyText);
  outputBox.focus();
  statusBox.setContent('{green-fg}History displayed - Press Ctrl+R to return to input{/green-fg}');
  screen.render();
});

// Focus
inputBox.focus();

screen.render();