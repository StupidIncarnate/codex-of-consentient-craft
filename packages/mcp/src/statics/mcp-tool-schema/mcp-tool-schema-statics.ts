/**
 * PURPOSE: Defines JSON Schema definitions for MCP tools derived from contracts
 *
 * USAGE:
 * const schema = mcpToolSchemaStatics.discover;
 * // Returns MCP tool schema with name, description, and JSON Schema inputSchema
 *
 * MCP tool schema definitions derived from contracts
 *
 * These schemas mirror the structure of discoverInputContract but in JSON Schema format
 * required by the MCP protocol.
 */

export const mcpToolSchemaStatics = {
  discover: {
    name: 'discover',
    description: 'Discover utilities, brokers, standards across the codebase',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['files', 'standards'],
          description: 'Type of discovery: files or standards',
        },
        path: {
          type: 'string',
          description: 'Path to search (for files)',
        },
        fileType: {
          type: 'string',
          description: 'File type to filter (broker, widget, guard, etc.)',
        },
        search: {
          type: 'string',
          description: 'Search query',
        },
        name: {
          type: 'string',
          description: 'Specific file name',
        },
        section: {
          type: 'string',
          description: 'Standards section path (for standards)',
        },
      },
      required: ['type'],
    },
  },
  'get-architecture': {
    name: 'get-architecture',
    description: 'Returns complete architecture overview',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  'get-folder-detail': {
    name: 'get-folder-detail',
    description: 'Returns detailed information about a specific folder type',
    inputSchema: {
      type: 'object',
      properties: {
        folderType: {
          type: 'string',
          enum: [
            'statics',
            'contracts',
            'guards',
            'transformers',
            'errors',
            'flows',
            'adapters',
            'middleware',
            'brokers',
            'bindings',
            'state',
            'responders',
            'widgets',
            'startup',
          ],
          description: 'Type of folder to get details for',
        },
      },
      required: ['folderType'],
    },
  },
  'get-syntax-rules': {
    name: 'get-syntax-rules',
    description: 'Returns universal syntax rules',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
} as const;
