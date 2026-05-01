/**
 * PURPOSE: Returns ToolRegistration[] for architecture-related MCP tools (discover, get-architecture, get-folder-detail, get-syntax-rules, get-testing-patterns, get-project-map, get-project-inventory)
 *
 * USAGE:
 * const registrations = ArchitectureFlow();
 * // Returns 7 ToolRegistration objects that delegate to ArchitectureHandleResponder
 */

import { zodToJsonSchema } from 'zod-to-json-schema';

import { discoverInputContract } from '../../contracts/discover-input/discover-input-contract';
import { folderDetailInputContract } from '../../contracts/folder-detail-input/folder-detail-input-contract';
import { getProjectInventoryInputContract } from '../../contracts/get-project-inventory-input/get-project-inventory-input-contract';
import type { ToolRegistration } from '../../contracts/tool-registration/tool-registration-contract';
import { ArchitectureHandleResponder } from '../../responders/architecture/handle/architecture-handle-responder';

const jsonSchemaOptions = { $refStrategy: 'none' as const };
const discoverSchema = zodToJsonSchema(discoverInputContract as never, jsonSchemaOptions);
const emptySchema = { type: 'object', properties: {}, additionalProperties: false };
const folderDetailSchema = zodToJsonSchema(folderDetailInputContract as never, jsonSchemaOptions);
const getProjectInventorySchema = zodToJsonSchema(
  getProjectInventoryInputContract as never,
  jsonSchemaOptions,
);

export const ArchitectureFlow = (): ToolRegistration[] => [
  {
    name: 'discover' as never,
    description: 'Discover utilities, brokers, and files across the codebase' as never,
    inputSchema: discoverSchema as never,
    handler: async ({ args }) => ArchitectureHandleResponder({ tool: 'discover' as never, args }),
  },
  {
    name: 'get-architecture' as never,
    description: 'Returns complete architecture overview' as never,
    inputSchema: emptySchema as never,
    handler: async ({ args }) =>
      ArchitectureHandleResponder({ tool: 'get-architecture' as never, args }),
  },
  {
    name: 'get-folder-detail' as never,
    description: 'Returns detailed information about a specific folder type' as never,
    inputSchema: folderDetailSchema as never,
    handler: async ({ args }) =>
      ArchitectureHandleResponder({ tool: 'get-folder-detail' as never, args }),
  },
  {
    name: 'get-syntax-rules' as never,
    description: 'Returns universal syntax rules' as never,
    inputSchema: emptySchema as never,
    handler: async ({ args }) =>
      ArchitectureHandleResponder({ tool: 'get-syntax-rules' as never, args }),
  },
  {
    name: 'get-testing-patterns' as never,
    description: 'Returns testing patterns and philosophy for writing tests and proxies' as never,
    inputSchema: emptySchema as never,
    handler: async ({ args }) =>
      ArchitectureHandleResponder({ tool: 'get-testing-patterns' as never, args }),
  },
  {
    name: 'get-project-map' as never,
    description:
      'Returns compact codebase map with packages, folder types, file counts, and domains' as never,
    inputSchema: emptySchema as never,
    handler: async ({ args }) =>
      ArchitectureHandleResponder({ tool: 'get-project-map' as never, args }),
  },
  {
    name: 'get-project-inventory' as never,
    description:
      'Returns the per-package folder/file inventory section for a single package' as never,
    inputSchema: getProjectInventorySchema as never,
    handler: async ({ args }) =>
      ArchitectureHandleResponder({ tool: 'get-project-inventory' as never, args }),
  },
];
