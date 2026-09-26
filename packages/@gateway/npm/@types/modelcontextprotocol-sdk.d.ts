// The SDK's package.json exports only an ESM/CJS conditional map with no legacy `main`/`types`
// field, so node10 module resolution (this repo's `moduleResolution: "node"`) cannot find its
// subpath declarations at all — confirmed with `tsc --traceResolution`, and already worked around
// the same way in packages/mcp/@types/modelcontextprotocol.d.ts for the same three subpaths.
// These ambient declarations name the members the pass-through modules re-export, not the SDK's
// full surface.

declare module '@modelcontextprotocol/sdk/server' {
  export interface ServerOptions {
    capabilities?: {
      tools?: Record<string, unknown>;
      prompts?: Record<string, unknown>;
      resources?: Record<string, unknown>;
    };
    instructions?: string;
  }

  export interface ServerInfo {
    name: string;
    version: string;
  }

  export interface McpTransport {
    // Transport interface marker
  }

  export class Server {
    constructor(serverInfo: ServerInfo, options?: ServerOptions);
    setRequestHandler<T>(
      schema: unknown,
      handler: (request: T) => Promise<unknown> | unknown,
    ): void;
    connect(transport: McpTransport): Promise<void>;
  }
}

declare module '@modelcontextprotocol/sdk/server/stdio.js' {
  import type { McpTransport } from '@modelcontextprotocol/sdk/server';

  export class StdioServerTransport implements McpTransport {
    constructor();
  }
}

declare module '@modelcontextprotocol/sdk/types.js' {
  export const ListToolsRequestSchema: unknown;
  export const CallToolRequestSchema: unknown;

  export interface CallToolRequest {
    params: {
      name: string;
      arguments?: Record<string, unknown>;
    };
  }
}
