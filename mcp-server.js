#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { chromium } from 'playwright';

class PlaywrightMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'playwright-browser',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.browser = null;
    this.page = null;
    this.context = null;
    
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'launch_browser',
          description: 'Launch a new browser instance',
          inputSchema: {
            type: 'object',
            properties: {
              headless: {
                type: 'boolean',
                description: 'Whether to run browser in headless mode',
                default: false
              },
              url: {
                type: 'string',
                description: 'URL to navigate to',
                default: 'about:blank'
              }
            }
          }
        },
        {
          name: 'navigate',
          description: 'Navigate to a URL',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'URL to navigate to'
              }
            },
            required: ['url']
          }
        },
        {
          name: 'click',
          description: 'Click on an element',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector for the element to click'
              }
            },
            required: ['selector']
          }
        },
        {
          name: 'type',
          description: 'Type text into an element',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector for the element to type into'
              },
              text: {
                type: 'string',
                description: 'Text to type'
              }
            },
            required: ['selector', 'text']
          }
        },
        {
          name: 'screenshot',
          description: 'Take a screenshot of the current page',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Path to save screenshot',
                default: 'screenshot.png'
              }
            }
          }
        },
        {
          name: 'get_text',
          description: 'Get text content of an element',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector for the element'
              }
            },
            required: ['selector']
          }
        },
        {
          name: 'wait_for_element',
          description: 'Wait for an element to be visible',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector for the element to wait for'
              },
              timeout: {
                type: 'number',
                description: 'Timeout in milliseconds',
                default: 5000
              }
            },
            required: ['selector']
          }
        },
        {
          name: 'evaluate',
          description: 'Execute JavaScript in the browser',
          inputSchema: {
            type: 'object',
            properties: {
              script: {
                type: 'string',
                description: 'JavaScript code to execute'
              }
            },
            required: ['script']
          }
        },
        {
          name: 'close_browser',
          description: 'Close the browser instance',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'launch_browser':
            return await this.launchBrowser(args);
          case 'navigate':
            return await this.navigate(args);
          case 'click':
            return await this.click(args);
          case 'type':
            return await this.type(args);
          case 'screenshot':
            return await this.screenshot(args);
          case 'get_text':
            return await this.getText(args);
          case 'wait_for_element':
            return await this.waitForElement(args);
          case 'evaluate':
            return await this.evaluate(args);
          case 'close_browser':
            return await this.closeBrowser();
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error: ${error.message}`
          }],
          isError: true
        };
      }
    });
  }

  async launchBrowser(args = {}) {
    const { headless = false, url = 'about:blank' } = args;
    
    this.browser = await chromium.launch({ 
      headless,
      slowMo: 100 // Add delay between actions for visibility
    });
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
    
    if (url !== 'about:blank') {
      await this.page.goto(url);
    }
    
    return {
      content: [{
        type: 'text',
        text: `Browser launched successfully${url !== 'about:blank' ? ` and navigated to ${url}` : ''}`
      }]
    };
  }

  async navigate(args) {
    if (!this.page) throw new Error('Browser not launched');
    
    const { url } = args;
    await this.page.goto(url);
    
    return {
      content: [{
        type: 'text',
        text: `Navigated to ${url}`
      }]
    };
  }

  async click(args) {
    if (!this.page) throw new Error('Browser not launched');
    
    const { selector } = args;
    await this.page.click(selector);
    
    return {
      content: [{
        type: 'text',
        text: `Clicked on ${selector}`
      }]
    };
  }

  async type(args) {
    if (!this.page) throw new Error('Browser not launched');
    
    const { selector, text } = args;
    await this.page.fill(selector, text);
    
    return {
      content: [{
        type: 'text',
        text: `Typed "${text}" into ${selector}`
      }]
    };
  }

  async screenshot(args = {}) {
    if (!this.page) throw new Error('Browser not launched');
    
    const { path = 'screenshot.png' } = args;
    const buffer = await this.page.screenshot({ path, fullPage: true });
    
    return {
      content: [{
        type: 'text',
        text: `Screenshot saved to ${path}`
      }, {
        type: 'image',
        data: buffer.toString('base64'),
        mimeType: 'image/png'
      }]
    };
  }

  async getText(args) {
    if (!this.page) throw new Error('Browser not launched');
    
    const { selector } = args;
    const text = await this.page.textContent(selector);
    
    return {
      content: [{
        type: 'text',
        text: `Text content of ${selector}: "${text}"`
      }]
    };
  }

  async waitForElement(args) {
    if (!this.page) throw new Error('Browser not launched');
    
    const { selector, timeout = 5000 } = args;
    await this.page.waitForSelector(selector, { timeout });
    
    return {
      content: [{
        type: 'text',
        text: `Element ${selector} is now visible`
      }]
    };
  }

  async evaluate(args) {
    if (!this.page) throw new Error('Browser not launched');
    
    const { script } = args;
    const result = await this.page.evaluate(script);
    
    return {
      content: [{
        type: 'text',
        text: `Script result: ${JSON.stringify(result)}`
      }]
    };
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.context = null;
    }
    
    return {
      content: [{
        type: 'text',
        text: 'Browser closed'
      }]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new PlaywrightMCPServer();

// Handle cleanup
process.on('SIGINT', async () => {
  if (server?.browser) {
    await server.browser.close();
  }
  process.exit(0);
});

server.run().catch(console.error);