/**
 * MCP Server - Main Entry Point
 * This is the "brain" that coordinates test execution
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createLogger } from '../utils/logger';
import { ScenarioExecutor } from './scenario-executer';
import fs from 'fs';
import path from 'path';

/**
 * MCPTestServer - Orchestrates test execution via MCP protocol
 */
export class MCPTestServer {
  private server: Server;
  private logger = createLogger('MCPTestServer');
  private scenarioExecutor: ScenarioExecutor;

  constructor() {
    // Initialize MCP server with capabilities
    this.server = new Server(
      {
        name: process.env.MCP_SERVER_NAME || 'mcp-playwright-step1',
        version: process.env.MCP_SERVER_VERSION || '1.0.0',
      },
      {
        capabilities: {
          tools: {}, // We expose tools for test execution
          resources: {}, // We expose resources for scenario files
          prompts: {}, // Future: AI-driven test generation
        },
      }
    );

    this.scenarioExecutor = new ScenarioExecutor();
    this.setupHandlers();
    
    this.logger.info('MCP Test Server initialized', {
      name: process.env.MCP_SERVER_NAME,
      version: process.env.MCP_SERVER_VERSION,
    });
  }

  /**
   * Set up all MCP request handlers
   */
  private setupHandlers(): void {
    // Handle tool listing - shows available tools to clients
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.logger.debug('Handling ListTools request');
      
      return {
        tools: [
          {
            name: 'execute_scenario',
            description: 'Execute a test scenario from a JSON file',
            inputSchema: {
              type: 'object',
              properties: {
                scenarioPath: {
                  type: 'string',
                  description: 'Path to the test scenario JSON file',
                },
                options: {
                  type: 'object',
                  description: 'Execution options',
                  properties: {
                    headless: { type: 'boolean', default: true },
                    slowMo: { type: 'number', default: 0 },
                    timeout: { type: 'number', default: 30000 },
                    screenshot: { type: 'boolean', default: true },
                  },
                },
              },
              required: ['scenarioPath'],
            },
          },
          {
            name: 'list_scenarios',
            description: 'List all available test scenario files',
            inputSchema: {
              type: 'object',
              properties: {
                directory: {
                  type: 'string',
                  description: 'Directory to search for scenarios',
                  default: './test-scenarios',
                },
              },
            },
          },
          {
            name: 'validate_scenario',
            description: 'Validate a test scenario JSON structure without executing',
            inputSchema: {
              type: 'object',
              properties: {
                scenarioPath: {
                  type: 'string',
                  description: 'Path to the test scenario JSON file',
                },
              },
              required: ['scenarioPath'],
            },
          },
          {
            name: 'get_health',
            description: 'Get server health status',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
        ],
      };
    });

    // Handle tool execution - actual test execution happens here
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      this.logger.info('Tool call received', { tool: name, arguments: args });

      try {
        switch (name) {
          case 'execute_scenario':
            return await this.executeScenario(args);
          
          case 'list_scenarios':
            return await this.listScenarios(args);
          
          case 'validate_scenario':
            return await this.validateScenario(args);
          
          case 'get_health':
            return this.getHealth();
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        this.logger.error('Tool execution failed', {
          tool: name,
          error: error instanceof Error ? error.message : String(error),
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : String(error),
              }, null, 2),
            },
          ],
        };
      }
    });

    // Handle resource listing - shows available test scenarios
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      this.logger.debug('Handling ListResources request');
      
      const scenariosDir = './test-scenarios';
      const scenarios: any[] = [];

      if (fs.existsSync(scenariosDir)) {
        const files = fs.readdirSync(scenariosDir);
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            scenarios.push({
              uri: `file://${path.resolve(scenariosDir, file)}`,
              name: file,
              description: `Test scenario: ${file}`,
              mimeType: 'application/json',
            });
          }
        }
      }

      return { resources: scenarios };
    });
  }

  /**
   * Execute a test scenario
   */
  private async executeScenario(args: any) {
    const { scenarioPath, options = {} } = args;

    this.logger.info('Executing scenario', { scenarioPath, options });

    const result = await this.scenarioExecutor.executeScenario(
      scenarioPath,
      options
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            result,
          }, null, 2),
        },
      ],
    };
  }

  /**
   * List available test scenarios
   */
  private async listScenarios(args: any) {
    const directory = args?.directory || './test-scenarios';
    
    this.logger.info('Listing scenarios', { directory });

    if (!fs.existsSync(directory)) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: `Directory not found: ${directory}`,
            }, null, 2),
          },
        ],
      };
    }

    const files = fs.readdirSync(directory)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(directory, file));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            scenarios: files,
            count: files.length,
          }, null, 2),
        },
      ],
    };
  }

  /**
   * Validate scenario structure
   */
  private async validateScenario(args: any) {
    const { scenarioPath } = args;
    
    this.logger.info('Validating scenario', { scenarioPath });

    try {
      // Basic validation - check if file exists and is valid JSON
      if (!fs.existsSync(scenarioPath)) {
        throw new Error(`Scenario file not found: ${scenarioPath}`);
      }

      const content = fs.readFileSync(scenarioPath, 'utf-8');
      const scenario = JSON.parse(content);

      // Validate required fields
      const requiredFields = ['scenarioId', 'scenarioName', 'baseUrl', 'testCases'];
      const missingFields = requiredFields.filter(field => !scenario[field]);

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              valid: true,
              scenario: {
                id: scenario.scenarioId,
                name: scenario.scenarioName,
                testCases: scenario.testCases.length,
              },
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              valid: false,
              error: error instanceof Error ? error.message : String(error),
            }, null, 2),
          },
        ],
      };
    }
  }

  /**
   * Get server health status
   */
  private getHealth() {
    const uptime = process.uptime();
    const memory = process.memoryUsage();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            status: 'healthy',
            uptime: `${Math.floor(uptime)}s`,
            memory: {
              used: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
              total: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`,
            },
          }, null, 2),
        },
      ],
    };
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    this.logger.info('MCP Test Server started successfully', {
      transport: 'stdio',
      capabilities: ['tools', 'resources'],
    });
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new MCPTestServer();
  
  server.start().catch((error) => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });
}