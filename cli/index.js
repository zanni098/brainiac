#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { program } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');

// Configuration management
const CONFIG_DIR = path.join(os.homedir(), '.brainiac');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function loadConfig() {
  ensureConfigDir();
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
- Be specific, analytical, and cite everything
- Include statistics, data points, and expert quotes when available
- Provide balanced perspectives on controversial topics
- Highlight knowledge gaps and areas requiring further research`
  };
}

function saveConfig(config) {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// API adapters
const API_ADAPTERS = {
  anthropic: {
    formatRequest: (config, query) => ({
      model: config.model,
      max_tokens: config.maxTokens,
      system: config.systemPrompt,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: `Research this thoroughly: "${query}"\n\nSearch Wikipedia, Open Library, recent news, and academic sources. Write a complete cited report with data, statistics, and expert perspectives.` }],
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
        { role: 'user', content: `Research this thoroughly: "${query}"\n\nSearch Wikipedia, Open Library, recent news, and academic sources. Write a complete cited report with data, statistics, and expert perspectives.` }
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
        { role: 'user', content: `Research this thoroughly: "${query}"\n\nSearch Wikipedia, Open Library, recent news, and academic sources. Write a complete cited report with data, statistics, and expert perspectives.` }
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
  const adapter = API_ADAPTERS[config.provider] || API_ADAPTERS.custom;
  const body = adapter.formatRequest(config, query);
  const headers = adapter.formatHeaders(config, config.apiKey);

  const response = await axios.post(config.apiUrl, body, { headers });
  return adapter.parseResponse(response.data);
}

// CLI Commands
program
  .name('brainiac')
  .description('Advanced research agent with multi-LLM support')
  .version('1.0.0');

program
  .command('config')
  .description('Configure Brainiac API settings')
  .action(async () => {
    const config = loadConfig();
    
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'provider',
        message: 'Select API provider:',
        choices: ['anthropic', 'openai', 'custom'],
        default: config.provider
      },
      {
        type: 'input',
        name: 'apiUrl',
        message: 'API URL:',
        default: config.apiUrl
      },
      {
        type: 'password',
        name: 'apiKey',
        message: 'API Key:',
        default: config.apiKey || ''
      },
      {
        type: 'input',
        name: 'model',
        message: 'Model name:',
        default: config.model
      },
      {
        type: 'number',
        name: 'maxTokens',
        message: 'Max tokens:',
        default: config.maxTokens
      }
    ]);

    const newConfig = { ...config, ...answers };
    saveConfig(newConfig);
    
    console.log(chalk.green('✓ Configuration saved to'), chalk.yellow(CONFIG_FILE));
  });

program
  .command('research <query>')
  .description('Research a topic and generate a cited report')
  .option('-o, --output <file>', 'Output file path')
  .option('-f, --format <format>', 'Output format (md, txt, json)', 'md')
  .option('--no-save', 'Do not save to history')
  .action(async (query, options) => {
    const config = loadConfig();

    if (!config.apiKey) {
      console.log(chalk.red('Error: No API key configured. Run "brainiac config" to set up your API credentials.'));
      process.exit(1);
    }

    console.log(chalk.cyan('🧠 Brainiac Research Agent'));
    console.log(chalk.gray(`Query: ${query}`));
    console.log();

    const spinner = ora('Researching...').start();

    try {
      const report = await runResearch(query, config);
      spinner.succeed('Research complete!');

      console.log();
      console.log(chalk.bold.white('═'.repeat(60)));
      console.log(report);
      console.log(chalk.bold.white('═'.repeat(60)));
      console.log();

      // Save to history
      if (options.save !== false) {
        const historyFile = path.join(CONFIG_DIR, 'history.json');
        const history = fs.existsSync(historyFile) ? JSON.parse(fs.readFileSync(historyFile, 'utf8')) : [];
        history.unshift({
          id: Date.now(),
          query,
          report,
          timestamp: new Date().toISOString()
        });
        fs.writeFileSync(historyFile, JSON.stringify(history.slice(0, 50), null, 2));
      }

      // Export to file
      if (options.output) {
        let content;
        if (options.format === 'json') {
          content = JSON.stringify({ query, report, timestamp: new Date().toISOString() }, null, 2);
        } else {
          content = report;
        }
        fs.writeFileSync(options.output, content);
        console.log(chalk.green(`✓ Report saved to ${options.output}`));
      }

    } catch (error) {
      spinner.fail('Research failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command('history')
  .description('View research history')
  .option('-c, --clear', 'Clear history')
  .action((options) => {
    const historyFile = path.join(CONFIG_DIR, 'history.json');
    
    if (options.clear) {
      if (fs.existsSync(historyFile)) {
        fs.unlinkSync(historyFile);
        console.log(chalk.green('✓ History cleared'));
      }
      return;
    }

    if (!fs.existsSync(historyFile)) {
      console.log(chalk.yellow('No research history found.'));
      return;
    }

    const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    
    console.log(chalk.cyan('🧠 Research History'));
    console.log(chalk.gray('═'.repeat(60)));
    
    history.forEach((item, index) => {
      console.log(chalk.bold.white(`${index + 1}. ${item.query}`));
      console.log(chalk.gray(`   ${new Date(item.timestamp).toLocaleString()}`));
      console.log();
    });
  });

program
  .command('export <id> <output>')
  .description('Export a specific research report from history')
  .action((id, output) => {
    const historyFile = path.join(CONFIG_DIR, 'history.json');
    
    if (!fs.existsSync(historyFile)) {
      console.log(chalk.yellow('No research history found.'));
      process.exit(1);
    }

    const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    const index = parseInt(id) - 1;
    
    if (index < 0 || index >= history.length) {
      console.log(chalk.red('Invalid report ID'));
      process.exit(1);
    }

    const item = history[index];
    const ext = path.extname(output).toLowerCase();
    
    let content;
    if (ext === '.json') {
      content = JSON.stringify(item, null, 2);
    } else {
      content = item.report;
    }
    
    fs.writeFileSync(output, content);
    console.log(chalk.green(`✓ Exported to ${output}`));
  });

program.parse();