/**
 * PURPOSE: Returns ToolRegistration[] for architecture-related MCP tools (discover, get-architecture, get-folder-detail, get-testing-patterns, get-project-map, get-project-inventory)
 *
 * USAGE:
 * const registrations = ArchitectureFlow();
 * // Returns 6 ToolRegistration objects that delegate to ArchitectureHandleResponder
 */

import { toJSONSchema } from '#gateway/npm/zod';

import { discoverInputContract } from '../../contracts/discover-input/discover-input-contract';
import { folderDetailInputContract } from '../../contracts/folder-detail-input/folder-detail-input-contract';
import { getProjectInventoryInputContract } from '../../contracts/get-project-inventory-input/get-project-inventory-input-contract';
import { getProjectMapInputContract } from '../../contracts/get-project-map-input/get-project-map-input-contract';
import type { ToolRegistration } from '../../contracts/tool-registration/tool-registration-contract';
import { ArchitectureHandleResponder } from '../../responders/architecture/handle/architecture-handle-responder';
import { toolRegistrationContract } from '../../contracts/tool-registration/tool-registration-contract';

// `reused: 'inline'` is zod v4's native replacement for the deprecated `zod-to-json-schema`
// package's `$refStrategy: 'none'` — both mean "never emit a $ref/$defs pair for a schema reused
// across fields, inline it at each occurrence instead." The npm package itself only produces a
// correct schema for a v3-built input (its own README, as of the v4 upgrade: "so long as you
// still provide v3-schemas") — fed a real v4 schema it silently returns an empty shell, which is
// exactly the MCP tool inputSchema every caller here needs populated.
const jsonSchemaOptions = { reused: 'inline' as const };
const discoverSchema = toJSONSchema(discoverInputContract, jsonSchemaOptions);
const emptySchema = { type: 'object', properties: {}, additionalProperties: false };
const folderDetailSchema = toJSONSchema(folderDetailInputContract, jsonSchemaOptions);
const getProjectInventorySchema = toJSONSchema(getProjectInventoryInputContract, jsonSchemaOptions);
const getProjectMapSchema = toJSONSchema(getProjectMapInputContract, jsonSchemaOptions);

export const ArchitectureFlow = (): ToolRegistration[] => [
  {
    ...toolRegistrationContract.parse({
      name: 'discover',
      description:
        'Discover utilities, brokers, and files across the codebase. Identifier-shaped grep patterns (2+ word tokens, no regex metacharacters) match across naming conventions by default — pass strict:true for literal-regex matching.',
      inputSchema: discoverSchema,
    }),
    handler: async ({ args, meta }) =>
      ArchitectureHandleResponder({ tool: 'discover', args, meta }),
  },
  {
    ...toolRegistrationContract.parse({
      name: 'get-architecture',
      description: 'Returns complete architecture overview',
      inputSchema: emptySchema,
    }),
    handler: async ({ args, meta }) =>
      ArchitectureHandleResponder({ tool: 'get-architecture', args, meta }),
  },
  {
    ...toolRegistrationContract.parse({
      name: 'get-folder-detail',
      description: 'Returns detailed information about a specific folder type',
      inputSchema: folderDetailSchema,
    }),
    handler: async ({ args, meta }) =>
      ArchitectureHandleResponder({ tool: 'get-folder-detail', args, meta }),
  },
  {
    ...toolRegistrationContract.parse({
      name: 'get-testing-patterns',
      description: 'Returns testing patterns and philosophy for writing tests and proxies',
      inputSchema: emptySchema,
    }),
    handler: async ({ args, meta }) =>
      ArchitectureHandleResponder({ tool: 'get-testing-patterns', args, meta }),
  },
  {
    ...toolRegistrationContract.parse({
      name: 'get-project-map',
      description:
        'Returns a project-map slice for the requested packages: connection graphs, folder types, file counts. Pass one or more package names; required.',
      inputSchema: getProjectMapSchema,
    }),
    handler: async ({ args, meta }) =>
      ArchitectureHandleResponder({ tool: 'get-project-map', args, meta }),
  },
  {
    ...toolRegistrationContract.parse({
      name: 'get-project-inventory',
      description:
        'Returns the per-package folder/file inventory section for a single package',
      inputSchema: getProjectInventorySchema,
    }),
    handler: async ({ args, meta }) =>
      ArchitectureHandleResponder({ tool: 'get-project-inventory', args, meta }),
  },
];
