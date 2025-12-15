// Type augmentation for @modelcontextprotocol/sdk
// The SDK uses ESM subpath exports which don't resolve with node moduleResolution
// This provides type declarations for the subpath imports used in this package

declare module '@modelcontextprotocol/sdk/server' {
  export interface ServerOptions {
    capabilities?: {
      tools?: Record<string, unknown>;
      prompts?: Record<string, unknown>;
      resources?: Record<string, unknown>;
    };
    instructions?: string;
  }

  export class Server {
    constructor(serverInfo: { name: string; version: string }, options?: ServerOptions);
    setRequestHandler<T>(
      schema: unknown,
      handler: (request: T) => Promise<unknown> | unknown,
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
  export const ListToolsRequestSchema: unknown;
  export const CallToolRequestSchema: unknown;

  export interface CallToolRequest {
    params: {
      name: string;
      arguments?: Record<string, unknown>;
    };
  }
}
