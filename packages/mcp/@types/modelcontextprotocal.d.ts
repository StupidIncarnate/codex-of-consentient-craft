// Type definitions for @modelcontextprotocol/sdk
// This provides type safety for the MCP SDK which doesn't ship with complete TypeScript definitions

declare module '@modelcontextprotocol/sdk/server' {
  export interface ServerOptions {
    name: string;
    version: string;
  }

  export interface ServerCapabilities {
    capabilities: {
      tools?: Record<PropertyKey, unknown>;
      prompts?: Record<PropertyKey, unknown>;
      resources?: Record<PropertyKey, unknown>;
    };
  }

  export type RequestHandler<TRequest = unknown, TResponse = unknown> = (
    request: TRequest,
  ) => Promise<TResponse> | TResponse;

  export class Server {
    constructor(options: ServerOptions, capabilities: ServerCapabilities);
    setRequestHandler<TRequest = unknown, TResponse = unknown>(
      schema: unknown,
      handler: RequestHandler<TRequest, TResponse>,
    ): void;
    connect(transport: unknown): Promise<void>;
  }
}

declare module '@modelcontextprotocol/sdk/server/stdio' {
  export class StdioServerTransport {
    constructor();
  }
}

declare module '@modelcontextprotocol/sdk/types' {
  export interface ToolSchema {
    name: string;
    description?: string;
    inputSchema?: unknown;
  }

  export interface ListToolsResponse {
    tools: readonly ToolSchema[];
  }

  export interface CallToolRequest {
    params: {
      name: string;
      arguments?: unknown;
    };
  }

  export interface ContentBlock {
    type: string;
    text: string;
  }

  export interface CallToolResponse {
    content: readonly ContentBlock[];
  }

  export const ListToolsRequestSchema: unknown;
  export const CallToolRequestSchema: unknown;
}
