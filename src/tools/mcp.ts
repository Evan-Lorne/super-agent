import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
  isReadOnly: boolean;
}

export interface MCPClient {
  listTools(): Promise<MCPTool[]>;
  callTool(name: string, args: Record<string, unknown>): Promise<unknown>;
  close(): Promise<void>;
}

interface StdioMCPOptions {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  clientName: string;
  clientVersion: string;
}

export async function connectStdioMCP(options: StdioMCPOptions): Promise<MCPClient> {
  const transport = new StdioClientTransport({
    command: options.command,
    args: options.args,
    env: options.env,
  });
  const client = new Client({
    name: options.clientName,
    version: options.clientVersion,
  });

  await client.connect(transport);

  return {
    async listTools() {
      const { tools } = await client.listTools();
      return tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema as Record<string, unknown>,
        isReadOnly: tool.annotations?.readOnlyHint === true,
      }));
    },
    callTool(name, args) {
      return client.callTool({ name, arguments: args });
    },
    close() {
      return client.close();
    },
  };
}
